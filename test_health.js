async function test() {
  const r = await fetch('https://voxio1.vercel.app/api/health');
  console.log("HEALTH DATA:");
  console.log(await r.text());
}
test();
