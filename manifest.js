export const manifestForPlugIn = {
  registerType:'prompt',
  includeAssests:['favicon.ico', "apple-touc-icon.png", "masked-icon.svg"],
  manifest:{
    name:"VARIETY-HEAVEN",
    short_name:"variety-heaven",
    description:"Billing and Inventory Application For Variety Heaven",
    icons:[{
      src: '/android-chrome-192x192.png',
      sizes:'192x192',
      type:'image/png',
      purpose:'favicon'
    },
    {
      src:'/android-chrome-512x512.png',
      sizes:'512x512',
      type:'image/png',
      purpose:'favicon'
    },
    {
      src: '/apple-touch-icon.png',
      sizes:'180x180',
      type:'image/png',
      purpose:'apple touch icon',
    },
    {
      src: '/maskable_icon.png',
      sizes:'512x512',
      type:'image/png',
      purpose:'any maskable',
    }
  ],
  theme_color:'#1d2b4f',
  background_color:'#eef0f5',
  display:"standalone",
  scope:'/',
  start_url:"/",
  orientation:'portrait',
},
workbox: {
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
}
}