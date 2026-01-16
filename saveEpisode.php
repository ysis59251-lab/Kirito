<?php
header("Content-Type: application/json");

$input = json_decode(file_get_contents("php://input"), true);

$anime  = preg_replace("/[^a-z0-9_-]/i","",$input["anime"] ?? "");
$title  = $input["animeTitle"] ?? "";
$ep     = intval($input["ep"] ?? 0);
$video  = $input["video"] ?? "";
$poster = $input["poster"] ?? "";

if(!$anime || !$ep || !$video){
  http_response_code(400);
  echo json_encode(["error"=>"ข้อมูลไม่ครบ"]);
  exit;
}

$dir = "../data/$anime";
$file = "$dir/episodes.json";

if(!is_dir($dir)){
  mkdir($dir, 0777, true);
}

/* ===== โหลดของเดิม ===== */
$data = [
  "animeTitle" => $title,
  "episodes" => []
];

if(file_exists($file)){
  $data = json_decode(file_get_contents($file), true);
}

/* ===== กันตอนซ้ำ ===== */
foreach($data["episodes"] as $e){
  if($e["ep"] == $ep){
    echo json_encode(["error"=>"ตอนนี้มีอยู่แล้ว"]);
    exit;
  }
}

/* ===== เพิ่มตอน ===== */
$data["animeTitle"] = $data["animeTitle"] ?: $title;

$data["episodes"][] = [
  "ep" => $ep,
  "video" => $video,
  "poster" => $poster
];

/* ===== เรียงตอน ===== */
usort($data["episodes"], fn($a,$b)=>$a["ep"] <=> $b["ep"]);

file_put_contents(
  $file,
  json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);

echo json_encode(["success"=>true]);