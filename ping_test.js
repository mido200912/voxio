async function p() {
  while(true) {
    try {
      const res = await fetch('https://aithor0.vercel.app/api/ping');
      if (res.ok) {
        console.log("PING WORKED: ", await res.text());
        break;
      }
    } catch(e) {}
    console.log("Waiting for Vercel ping...");
    await new Promise(r => setTimeout(r, 4000));
  }
}
p();
