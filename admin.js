async function save(){
  const data = {
    anime: anime.value.trim(),
    animeTitle: title.value.trim(),
    ep: ep.value,
    video: video.value.trim(),
    poster: poster.value.trim()
  };

  const res = await fetch("api/saveEpisode.php",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(data)
  });

  const json = await res.json();

  if(json.success){
    alert("เพิ่มตอนสำเร็จ ✅");
  }else{
    alert(json.error || "ผิดพลาด");
  }
}