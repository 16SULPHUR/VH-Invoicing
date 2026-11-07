import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { customerService } from "@/services/customerService";
import { payLinkService } from "@/services/payLinkService";
import { newId, whatsappService } from "@/services/whatsappService";
import { useToast } from "@/hooks/use-toast";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import { useQueryWithDefault } from "@/hooks/useQueryWithDefault";
import { useCustomers } from "@/features/customers/hooks/useCustomers";
import { useShopSettings } from "@/features/settings/useShopSettings";
import { customerKey, invoiceCustomerKey } from "@/features/customers/lib/customerKey";
import { buildDirectory } from "../lib/audiences";
import { mergeRules } from "../lib/rules";
import { mergeTemplates } from "../lib/templates";

const DAY = 86_400_000;
const NO_LOG = Object.freeze({ entries: [], stored: null });
const NO_CONSENT = Object.freeze({});

/** Templates, rules and shop values, all kept with the shared shop settings. */
export function useWhatsAppSettings() {
  const shop = useShopSettings();
  const { settings, save } = shop;
  const templates = useMemo(() => mergeTemplates(settings.wa_templates), [settings.wa_templates]);
  const rules = useMemo(() => mergeRules(settings.wa_rules), [settings.wa_rules]);
  const edits = settings.wa_templates && typeof settings.wa_templates === "object" ? settings.wa_templates : {};

  return {
    ...shop,
    templates,
    rules,
    saveTemplate: ({ id, name, kind, hi, en }) => save({ wa_templates: { ...edits, [id]: { name, kind, hi, en } } }),
    dropTemplate: (id) => {
      const next = { ...edits };
      delete next[id];
      save({ wa_templates: next });
    },
    saveRules: (changes) => save({ wa_rules: { ...settings.wa_rules, ...changes } }),
  };
}

export function useWhatsAppSetup() {
  const query = useQuery({
    queryKey: queryKeys.whatsapp.setup,
    queryFn: () => whatsappService.setup(),
    retry: false,
    staleTime: 10 * 60_000,
  });
  return query.data ?? null;
}

/** Everyone the shop can message, with spend, visits, dues and consent. */
export function useCustomerDirectory() {
  const invoices = useQueryWithDefault({
    queryKey: queryKeys.whatsapp.invoices,
    queryFn: () => whatsappService.loadInvoices(),
    staleTime: 5 * 60_000,
  });
  useQueryErrorToast(invoices.error, "Couldn't load bills");
  const customers = useCustomers();
  const consent = useQueryWithDefault(
    { queryKey: queryKeys.whatsapp.consent, queryFn: () => customerService.localConsent() },
    NO_CONSENT
  );

  const directory = useMemo(
    () => buildDirectory(invoices.data, customers.data, consent.data),
    [invoices.data, customers.data, consent.data]
  );
  return { directory, isLoading: invoices.isLoading || customers.isLoading };
}

/** Customer keys who bought something mentioning `keyword` in the last `days` days. */
export function useKeywordKeys(keyword, days, enabled) {
  const since = useMemo(() => {
    const date = new Date(Date.now() - days * DAY);
    return date.toISOString().slice(0, 10);
  }, [days]);
  const needle = keyword.trim().toLowerCase();
  const query = useQueryWithDefault({
    queryKey: queryKeys.whatsapp.keyword(needle, since),
    queryFn: () => whatsappService.invoicesMentioning(needle, since),
    enabled: enabled && needle.length >= 2,
    staleTime: 5 * 60_000,
  });
  return {
    keys: useMemo(() => {
      const keys = new Set();
      for (const row of query.data) keys.add(invoiceCustomerKey(row));
      return keys;
    }, [query.data]),
    rows: query.data,
    isLoading: query.isFetching,
  };
}

/** The send log: who got what and when, newest first, grouped by customer key. */
export function useWaLog() {
  const queryClient = useQueryClient();
  const [since] = useState(() => new Date(Date.now() - 400 * DAY).toISOString());
  const query = useQueryWithDefault(
    { queryKey: queryKeys.whatsapp.log, queryFn: () => whatsappService.listLog(since), retry: false },
    NO_LOG
  );
  useQueryErrorToast(query.error, "Couldn't load the WhatsApp log");

  const byKey = useMemo(() => {
    const map = new Map();
    for (const entry of query.data.entries) {
      if (!map.has(entry.customer_key)) map.set(entry.customer_key, []);
      map.get(entry.customer_key).push(entry);
    }
    return map;
  }, [query.data]);

  const setEntries = (update) =>
    queryClient.setQueryData(queryKeys.whatsapp.log, (previous) => ({
      stored: previous?.stored ?? null,
      entries: update(previous?.entries ?? []),
    }));

  const add = useMutation({
    mutationFn: (entry) => whatsappService.addLog(entry),
    onMutate: (entry) => setEntries((entries) => [entry, ...entries]),
  });
  const remove = useMutation({
    mutationFn: (id) => whatsappService.removeLog(id),
    onMutate: (id) => setEntries((entries) => entries.filter((entry) => entry.id !== id)),
  });

  return {
    entries: query.data.entries,
    stored: query.data.stored,
    byKey,
    /** Logs a send or skip and returns the entry straight away. */
    record: ({ customer, template, kind, campaign, text, status = "sent" }) => {
      const entry = {
        id: newId(),
        customer_key: customer.key,
        phone: customer.phone || null,
        template,
        kind,
        campaign: campaign || null,
        text,
        status,
        created_at: new Date().toISOString(),
      };
      add.mutate(entry);
      return entry;
    },
    undo: (id) => remove.mutate(id),
  };
}

export function useSetOffers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ customer, allow }) => customerService.setOffers(customer, allow),
    onSuccess: (_, { customer, allow }) => {
      toast({ title: allow ? `${customer.name || "Customer"} will get offers` : `No more offers to ${customer.name || "this customer"}` });
    },
    onError: (error) => toast({ title: "Couldn't save", description: error.message, variant: "destructive" }),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.whatsapp.consent }),
      ]),
  });
}

/** Live pay links for these customers, created as needed. Empty until the SQL is run. */
export function usePayLinks(keys, validDays, enabled) {
  const sorted = useMemo(() => [...new Set(keys)].sort(), [keys]);
  const query = useQuery({
    queryKey: queryKeys.whatsapp.payLinks(sorted),
    queryFn: () => payLinkService.ensure(sorted, validDays),
    enabled: enabled && sorted.length > 0,
    staleTime: Infinity,
    retry: false,
  });
  useQueryErrorToast(query.error, "Couldn't make pay links");
  return { tokens: query.data ?? null, isLoading: query.isFetching };
}

/** One customer's offer consent, from their customers row or this browser. */
export function useCustomerConsent(customer) {
  const customers = useCustomers();
  const local = useQueryWithDefault(
    { queryKey: queryKeys.whatsapp.consent, queryFn: () => customerService.localConsent() },
    NO_CONSENT
  );
  return useMemo(() => {
    if (!customer) return null;
    const key = customerKey(customer);
    const row = customers.data.find((item) => customerKey(item) === key);
    const source = row ?? local.data[key] ?? {};
    return {
      recordId: row?.id ?? null,
      optin: Boolean(source.wa_optin),
      optoutAt: source.wa_optout_at ?? null,
    };
  }, [customer, customers.data, local.data]);
}
