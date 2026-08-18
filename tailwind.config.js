/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {
    colors: { ink:'#151311', charcoal:'#211E1A', 'charcoal-raised':'#2B2721', 'charcoal-soft':'#383229', amber:'#C58B4A', 'amber-bright':'#E0AA62', cream:'#F2EBDD', 'cream-muted':'#C8BDAA', 'cream-dim':'#958A7A', black:'#0C0B0A', white:'#FFFDF8' },
    fontFamily: { display:['Barlow Condensed','Arial Narrow','sans-serif'], quote:['Cormorant Garamond','Georgia','serif'], body:['DM Sans','Helvetica Neue','Arial','sans-serif'] }
  } }
}
