async function p() {
  const r = await fetch('https://aithor0.vercel.app/api/health');
  console.log(r.status);
  console.log(await r.text());
}
p();
