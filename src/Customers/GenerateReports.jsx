import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '../supabaseClient';

const GenerateReports = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCustomerReport = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      // Here you would typically process the data and generate a report
      // For this example, we'll just log it to the console
      console.log('Customer Report Data:', data);

      // In a real application, you might want to:
      // 1. Format the data into a CSV or PDF
      // 2. Offer a download link to the user
      // 3. Send the report via email
      // 4. Display the report in a modal or new page

      alert('Report generated successfully! Check the console for data.');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Customer Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={generateCustomerReport} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate Customer Report'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GenerateReports;