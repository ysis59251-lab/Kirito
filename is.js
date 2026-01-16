function updateProgress(){
  const rows = document.querySelectorAll("#epTable tbody tr");
  const total = rows.length;
  let done = 0;

  rows.forEach(row=>{
    row.classList.remove("done","wait");
    const status = row.dataset.status;
    row.classList.add(status);
    if(status === "done") done++;
  });

  const wait = total - done;
  const percent = Math.round((done / total) * 100);

  document.getElementById("doneCount").innerText = done;
  document.getElementById("waitCount").innerText = wait;
  document.getElementById("totalCount").innerText = total;

  const bar = document.getElementById("progressBar");
  bar.style.width = percent + "%";
  bar.innerText = percent + "%";
}

// คลิกเปลี่ยนสถานะ
document.querySelectorAll(".status").forEach(cell=>{
  cell.addEventListener("click",()=>{
    const row = cell.parentElement;
    if(row.dataset.status === "done"){
      row.dataset.status = "wait";
      cell.innerText = "ยังไม่ลง";
    }else{
      row.dataset.status = "done";
      cell.innerText = "ลงแล้ว";
    }
    updateProgress();
  });
});

// เริ่มต้น
updateProgress();