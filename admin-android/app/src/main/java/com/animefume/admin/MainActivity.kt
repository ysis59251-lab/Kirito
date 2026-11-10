package com.animefume.admin

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject

private val Bg = Color(0xFF080B10)
private val Panel = Color(0xFF151B24)
private val Panel2 = Color(0xFF1D2733)
private val Mint = Color(0xFF35E0C1)
private val Warning = Color(0xFFFFC857)
private val Danger = Color(0xFFFF7B86)
private val Muted = Color(0xFF9AA7B5)
private const val API_URL = "https://script.google.com/macros/s/AKfycbxWBZkZyb5NRdMXLkBpwCX-zvDEc2BFSZFPzazKpyWsMSYlD0A7TL8GUP_Esy5MBbbNhg/exec"
private const val RTDB_URL = "https://mpmp-5864a-default-rtdb.firebaseio.com"

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { AnimeFumeAdminApp() }
    }
}

data class OnlineUser(val id: String, val page: String, val title: String, val time: Long, val role: String)
data class ReportItem(val id: String, val page: String, val detail: String, val time: Long, val read: Boolean, val meta: String)
data class Announcement(val id: String, val title: String, val body: String, val active: Boolean, val updatedAt: Long)
data class Assistant(val uid: String, val email: String, val role: String, val active: Boolean)

data class AdminSession(val uid: String, val role: String, val email: String)

@Composable
private fun AnimeFumeAdminApp() {
    val auth = remember { FirebaseAuth.getInstance() }
    var user by remember { mutableStateOf(auth.currentUser) }
    var session by remember { mutableStateOf<AdminSession?>(null) }
    var checking by remember { mutableStateOf(user != null) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(user?.uid) {
        if (user == null) { session = null; checking = false; return@LaunchedEffect }
        checking = true
        FirebaseDatabase.getInstance(RTDB_URL).getReference("adminUsers/${user!!.uid}").get()
            .addOnSuccessListener { snapshot ->
                val active = snapshot.exists() && (snapshot.child("active").getValue(Boolean::class.java) == true || snapshot.child("active").getValue(String::class.java)?.equals("true", ignoreCase = true) == true)
                val role = snapshot.child("role").getValue(String::class.java) ?: "admin"
                val email = snapshot.child("email").getValue(String::class.java) ?: user!!.email.orEmpty()
                session = if (active) AdminSession(user!!.uid, role, email) else null
                error = if (!active) "บัญชีนี้ยังไม่ได้รับสิทธิ์ผู้ดูแลระบบ" else null
                checking = false
            }
            .addOnFailureListener { error = "ตรวจสอบสิทธิ์ไม่สำเร็จ: ${it.localizedMessage}"; checking = false }
    }

    MaterialTheme(colorScheme = darkColorScheme(primary = Mint, background = Bg, surface = Panel, onSurface = Color.White)) {
        Surface(Modifier.fillMaxSize(), color = Bg) {
            when {
                user == null -> LoginScreen(error) { email, password ->
                    error = null; checking = true
                    auth.signInWithEmailAndPassword(email.trim(), password).addOnCompleteListener { task ->
                        checking = false
                        if (task.isSuccessful) user = auth.currentUser else error = task.exception?.localizedMessage ?: "เข้าสู่ระบบไม่สำเร็จ"
                    }
                }
                checking -> LoadingScreen("กำลังตรวจสอบสิทธิ์ผู้ดูแล…")
                session != null -> AdminConsole(session!!, onSignOut = { auth.signOut(); user = null })
                else -> AccessDenied(error ?: "ไม่มีสิทธิ์เข้าใช้งาน") { auth.signOut(); user = null }
            }
        }
    }
}

@Composable
private fun LoginScreen(error: String?, onLogin: (String, String) -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Image(painterResource(R.drawable.admin_cover), "ภาพปก AnimeFume Admin", Modifier.fillMaxSize(), contentScale = ContentScale.Crop, alpha = 0.34f)
        Box(Modifier.fillMaxSize().background(Brush.linearGradient(listOf(Color(0xDD101D26), Color(0xE6080B10), Color(0xDD1C1020)))))
        Column(Modifier.fillMaxWidth().widthIn(max = 440.dp).padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(Icons.Default.AdminPanelSettings, null, tint = Mint, modifier = Modifier.size(58.dp))
            Spacer(Modifier.height(12.dp))
            Text("ANIMEFUME", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
            Text("ADMIN CONTROL CENTER", color = Mint, style = MaterialTheme.typography.labelLarge)
            Spacer(Modifier.height(28.dp))
            Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(24.dp)) {
                Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Text("เข้าสู่ระบบผู้ดูแล", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    OutlinedTextField(email, { email = it }, Modifier.fillMaxWidth(), label = { Text("อีเมล") }, singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email))
                    OutlinedTextField(password, { password = it }, Modifier.fillMaxWidth(), label = { Text("รหัสผ่าน") }, singleLine = true, visualTransformation = PasswordVisualTransformation())
                    if (error != null) Text(error, color = Danger, style = MaterialTheme.typography.bodySmall)
                    Button({ onLogin(email, password) }, enabled = email.isNotBlank() && password.isNotBlank(), modifier = Modifier.fillMaxWidth().height(50.dp)) { Text("เข้าสู่ระบบ") }
                    Text("ระบบตรวจสิทธิ์กับ Firebase และอนุญาตเฉพาะบัญชีที่เจ้าของเพิ่มไว้", color = Muted, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AdminConsole(session: AdminSession, onSignOut: () -> Unit) {
    var tab by remember { mutableIntStateOf(0) }
    val tabs = listOf("ภาพรวม", "รายงาน", "ประกาศ", "เพิ่มตอน", "ผู้ช่วย")
    Scaffold(topBar = { TopAppBar(title = { Column { Text("AnimeFume Admin", fontWeight = FontWeight.Bold); Text("${session.role} • ${session.email}", color = Muted, style = MaterialTheme.typography.labelSmall) } }, actions = { IconButton(onClick = onSignOut) { Icon(Icons.Default.Logout, "ออกจากระบบ") } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Bg)) }, bottomBar = { NavigationBar(containerColor = Panel) { tabs.forEachIndexed { index, label -> NavigationBarItem(selected = tab == index, onClick = { tab = index }, icon = { Icon(listOf(Icons.Default.Dashboard, Icons.Default.ReportProblem, Icons.Default.Campaign, Icons.Default.VideoLibrary, Icons.Default.GroupAdd)[index], null) }, label = { Text(label) }) } } }, containerColor = Bg) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when (tab) {
                0 -> OverviewScreen()
                1 -> ReportsScreen()
                2 -> AnnouncementScreen(session.role)
                3 -> AddEpisodeScreen(session.uid)
                else -> AssistantsScreen(session)
            }
        }
    }
}

@Composable
private fun OverviewScreen() {
    val database = remember { FirebaseDatabase.getInstance(RTDB_URL) }
    var online by remember { mutableStateOf<List<OnlineUser>>(emptyList()) }
    var reports by remember { mutableIntStateOf(0) }
    var lastSync by remember { mutableLongStateOf(0L) }
    DisposableEffect(Unit) {
        val onlineRef = database.getReference("onlineUsers")
        val reportsRef = database.getReference("reports")
        val onlineListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val now = System.currentTimeMillis()
                online = snapshot.children.mapNotNull { child ->
                    val time = child.child("time").getValue(Long::class.java) ?: 0L
                    if (time == 0L || now - time > 15_000L || child.child("role").getValue(String::class.java) == "admin") null
                    else OnlineUser(child.key.orEmpty(), child.child("page").getValue(String::class.java).orEmpty(), child.child("title").getValue(String::class.java).orEmpty(), time, "user")
                }.sortedByDescending { it.time }
                lastSync = now
            }
            override fun onCancelled(error: DatabaseError) {}
        }
        val reportsListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) { reports = snapshot.children.count { it.child("read").getValue(Boolean::class.java) != true } }
            override fun onCancelled(error: DatabaseError) {}
        }
        onlineRef.addValueEventListener(onlineListener); reportsRef.addValueEventListener(reportsListener)
        onDispose { onlineRef.removeEventListener(onlineListener); reportsRef.removeEventListener(reportsListener) }
    }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp), contentPadding = PaddingValues(bottom = 20.dp)) {
        item { Text("ศูนย์ควบคุมแบบเรียลไทม์", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold); Text("ข้อมูลอัปเดตทันทีจาก AnimeFume", color = Muted) }
        item { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) { MetricCard("ออนไลน์", online.size.toString(), Mint, Modifier.weight(1f)); MetricCard("รายงานใหม่", reports.toString(), Danger, Modifier.weight(1f)) } }
        item { StatusCard("การเชื่อมต่อ", if (lastSync > 0) "เชื่อมต่อแล้ว • ${online.size} คนกำลังใช้งาน" else "กำลังเชื่อมต่อ…", lastSync > 0) }
        item { Text("ผู้ใช้ออนไลน์ล่าสุด", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold) }
        if (online.isEmpty()) item { EmptyCard("ยังไม่มีผู้ใช้งานออนไลน์") }
        items(online.take(20), key = { it.id }) { OnlineRow(it) }
    }
}

@Composable
private fun ReportsScreen() {
    val database = remember { FirebaseDatabase.getInstance(RTDB_URL) }
    var reports by remember { mutableStateOf<List<ReportItem>>(emptyList()) }
    DisposableEffect(Unit) {
        val ref = database.getReference("reports")
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) { reports = snapshot.children.map { ReportItem(it.key.orEmpty(), it.child("page").getValue(String::class.java).orEmpty(), it.child("detail").getValue(String::class.java).orEmpty(), it.child("time").getValue(Long::class.java) ?: 0L, it.child("read").getValue(Boolean::class.java) == true, "${it.child("language").getValue(String::class.java).orEmpty()} • ${it.child("screen").getValue(String::class.java).orEmpty()}") }.sortedByDescending { it.time } }
            override fun onCancelled(error: DatabaseError) {}
        }
        ref.addValueEventListener(listener); onDispose { ref.removeEventListener(listener) }
    }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp), contentPadding = PaddingValues(bottom = 20.dp)) {
        item { Text("รายงานปัญหา", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold); Text("แตะอ่านแล้วหรือลบรายการได้ทันที", color = Muted) }
        if (reports.isEmpty()) item { EmptyCard("ไม่มีรายงาน") }
        items(reports, key = { it.id }) { report -> ReportCard(report, database) }
    }
}

@Composable
private fun AnnouncementScreen(role: String) {
    val database = remember { FirebaseDatabase.getInstance(RTDB_URL) }
    var announcements by remember { mutableStateOf<List<Announcement>>(emptyList()) }
    var title by remember { mutableStateOf("") }; var body by remember { mutableStateOf("") }; var status by remember { mutableStateOf<String?>(null) }
    DisposableEffect(Unit) {
        val ref = database.getReference("siteConfig/announcement")
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                announcements = if (snapshot.exists()) listOf(Announcement("global", snapshot.child("title").getValue(String::class.java).orEmpty(), snapshot.child("body").getValue(String::class.java).orEmpty(), snapshot.child("active").getValue(Boolean::class.java) == true, snapshot.child("updatedAt").getValue(Long::class.java) ?: 0L)) else emptyList()
            }
            override fun onCancelled(error: DatabaseError) {}
        }
        ref.addValueEventListener(listener)
        onDispose { ref.removeEventListener(listener) }
    }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp), contentPadding = PaddingValues(bottom = 20.dp)) {
        item { Text("ประกาศหน้าเว็บ", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold); Text("เปิด/ปิดประกาศแบบเรียลไทม์", color = Muted) }
        if (role == "owner") item { Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(18.dp)) { Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) { Text("สร้างประกาศ", fontWeight = FontWeight.Bold); OutlinedTextField(title, { title = it }, Modifier.fillMaxWidth(), label = { Text("หัวข้อ") }); OutlinedTextField(body, { body = it }, Modifier.fillMaxWidth(), label = { Text("รายละเอียด") }); Button({ database.getReference("siteConfig/announcement").setValue(mapOf("title" to title.trim(), "body" to body.trim(), "active" to true, "updatedAt" to System.currentTimeMillis())); title = ""; body = ""; status = "สร้างประกาศแล้ว" }, enabled = title.isNotBlank() && body.isNotBlank(), modifier = Modifier.fillMaxWidth()) { Text("เผยแพร่ประกาศ") }; if (status != null) Text(status!!, color = Mint) } } }
        items(announcements, key = { it.id }) { announcement -> AnnouncementCard(announcement, database, role == "owner") }
    }
}

@Composable
private fun AddEpisodeScreen(uid: String) {
    var anime by remember { mutableStateOf("") }; var name by remember { mutableStateOf("") }; var episode by remember { mutableStateOf("") }; var video by remember { mutableStateOf("") }; var desc by remember { mutableStateOf("") }; var cover by remember { mutableStateOf("") }; var thaiDub by remember { mutableStateOf(true) }; var thaiSub by remember { mutableStateOf(false) }; var sending by remember { mutableStateOf(false) }; var status by remember { mutableStateOf<String?>(null) }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp), contentPadding = PaddingValues(bottom = 24.dp)) {
        item { Text("เพิ่มตอนเข้า Google Sheets", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold); Text("ส่งข้อมูลผ่าน API เดิมของ AnimeFume", color = Muted) }
        item { Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(18.dp)) { Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) { EpisodeField("รหัสอนิเมะ", anime) { anime = it }; EpisodeField("ชื่อเรื่อง", name) { name = it }; EpisodeField("ตอนที่", episode, KeyboardType.Number) { episode = it }; EpisodeField("ลิงก์วิดีโอ", video, KeyboardType.Uri) { video = it }; EpisodeField("เรื่องย่อ", desc) { desc = it }; EpisodeField("ลิงก์รูปปก", cover, KeyboardType.Uri) { cover = it }; Row(verticalAlignment = Alignment.CenterVertically) { Checkbox(thaiDub, { thaiDub = it }); Text("พากย์ไทย"); Spacer(Modifier.width(12.dp)); Checkbox(thaiSub, { thaiSub = it }); Text("ซับไทย") }; Button({ val languages = buildList { if (thaiDub) add("พากย์ไทย"); if (thaiSub) add("ซับไทย") }; sendEpisode(uid, anime, name, episode, video, desc, cover, languages) { sending = false; status = it }; sending = true; status = null }, enabled = !sending && anime.isNotBlank() && name.isNotBlank() && episode.isNotBlank() && video.isNotBlank() && (thaiDub || thaiSub), modifier = Modifier.fillMaxWidth()) { if (sending) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp) else Text("บันทึกตอน") }; if (status != null) Text(status!!, color = if (status!!.startsWith("สำเร็จ")) Mint else Danger) } } }
    }
}

@Composable
private fun AssistantsScreen(session: AdminSession) {
    val db = remember { FirebaseDatabase.getInstance(RTDB_URL) }; var assistants by remember { mutableStateOf<List<Assistant>>(emptyList()) }; var uid by remember { mutableStateOf("") }; var email by remember { mutableStateOf("") }; var status by remember { mutableStateOf<String?>(null) }
    DisposableEffect(Unit) {
        val ref = db.getReference("adminUsers")
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                assistants = snapshot.children.mapNotNull { child ->
                    val active = child.child("active").getValue(Boolean::class.java) == true || child.child("active").getValue(String::class.java)?.equals("true", ignoreCase = true) == true
                    if (!active) return@mapNotNull null
                    Assistant(child.key.orEmpty(), child.child("email").getValue(String::class.java).orEmpty(), child.child("role").getValue(String::class.java) ?: "admin", true)
                }
            }
            override fun onCancelled(error: DatabaseError) { status = "อ่านรายชื่อผู้ช่วยไม่สำเร็จ: ${error.message}" }
        }
        ref.addValueEventListener(listener)
        onDispose { ref.removeEventListener(listener) }
    }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp), contentPadding = PaddingValues(bottom = 20.dp)) {
        item { Text("ผู้ช่วยแอดมิน", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold); Text("จัดการเฉพาะบัญชีที่มีอยู่ใน Firebase Authentication", color = Muted) }
        if (session.role == "owner") item { Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(18.dp)) { Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) { EpisodeField("Firebase UID", uid) { uid = it }; EpisodeField("อีเมลสำหรับแสดงผล", email, KeyboardType.Email) { email = it }; Button({ db.getReference("adminUsers/${uid.trim()}").updateChildren(mapOf("active" to true, "role" to "admin", "email" to email.trim())).addOnSuccessListener { status = "เพิ่มผู้ช่วยแล้ว" }.addOnFailureListener { status = "เพิ่มไม่สำเร็จ: ${it.localizedMessage}" }; uid = ""; email = "" }, enabled = uid.isNotBlank(), modifier = Modifier.fillMaxWidth()) { Text("เพิ่มผู้ช่วย") }; if (status != null) Text(status!!, color = Mint) } } }
        items(assistants, key = { it.uid }) { assistant -> Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(14.dp)) { Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically) { Icon(if (assistant.role == "owner") Icons.Default.VerifiedUser else Icons.Default.Person, null, tint = if (assistant.role == "owner") Warning else Mint); Spacer(Modifier.width(10.dp)); Column(Modifier.weight(1f)) { Text(assistant.email.ifBlank { assistant.uid }, fontWeight = FontWeight.Bold); Text("${assistant.role} • active", color = Muted, style = MaterialTheme.typography.bodySmall) }; if (session.role == "owner" && assistant.uid != session.uid) TextButton({ db.getReference("adminUsers/${assistant.uid}").updateChildren(mapOf("active" to false)) }) { Text("ปิดสิทธิ์", color = Danger) } } } }
    }
}

@Composable private fun EpisodeField(label: String, value: String, type: KeyboardType = KeyboardType.Text, onValueChange: (String) -> Unit) { OutlinedTextField(value, onValueChange, Modifier.fillMaxWidth(), label = { Text(label) }, singleLine = label != "เรื่องย่อ", keyboardOptions = KeyboardOptions(keyboardType = type)) }
@Composable private fun MetricCard(label: String, value: String, color: Color, modifier: Modifier) { Card(modifier, colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(16.dp)) { Column(Modifier.padding(14.dp)) { Text(label, color = Muted); Text(value, color = color, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold) } } }
@Composable private fun StatusCard(label: String, value: String, ok: Boolean) { Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(16.dp)) { Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically) { Icon(if (ok) Icons.Default.CloudDone else Icons.Default.CloudOff, null, tint = if (ok) Mint else Warning); Spacer(Modifier.width(10.dp)); Column { Text(label, fontWeight = FontWeight.Bold); Text(value, color = Muted, style = MaterialTheme.typography.bodySmall) } } } }
@Composable private fun EmptyCard(message: String) { Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(16.dp)) { Text(message, Modifier.fillMaxWidth().padding(18.dp), color = Muted) } }
@Composable private fun OnlineRow(user: OnlineUser) { Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(14.dp)) { Row(Modifier.fillMaxWidth().padding(13.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Person, null, tint = Mint); Spacer(Modifier.width(10.dp)); Column { Text(user.title.ifBlank { "ไม่ระบุหน้า" }, fontWeight = FontWeight.Bold); Text(user.page, color = Muted, style = MaterialTheme.typography.bodySmall) } } } }
@Composable private fun ReportCard(report: ReportItem, database: FirebaseDatabase) { Card(colors = CardDefaults.cardColors(containerColor = if (report.read) Panel else Panel2), shape = RoundedCornerShape(14.dp)) { Column(Modifier.padding(14.dp)) { Row(verticalAlignment = Alignment.CenterVertically) { Text(report.page.ifBlank { "ไม่ระบุหน้า" }, Modifier.weight(1f), fontWeight = FontWeight.Bold); Text(if (report.read) "อ่านแล้ว" else "ใหม่", color = if (report.read) Muted else Warning, style = MaterialTheme.typography.labelSmall) }; Text(report.detail, Modifier.padding(top = 6.dp)); Text(report.meta, color = Muted, style = MaterialTheme.typography.bodySmall); Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) { if (!report.read) TextButton({ database.getReference("reports/${report.id}").updateChildren(mapOf("read" to true)) }) { Text("อ่านแล้ว") }; TextButton({ database.getReference("reports/${report.id}").removeValue() }) { Text("ลบ", color = Danger) } } } } }
@Composable private fun AnnouncementCard(item: Announcement, database: FirebaseDatabase, canEdit: Boolean) { Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(14.dp)) { Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically) { Column(Modifier.weight(1f)) { Text(item.title, fontWeight = FontWeight.Bold); Text(item.body, color = Muted, style = MaterialTheme.typography.bodySmall); Text(if (item.active) "กำลังแสดง" else "ปิดอยู่", color = if (item.active) Mint else Muted, style = MaterialTheme.typography.labelSmall) }; if (canEdit) Switch(item.active, { database.getReference("siteConfig/announcement").updateChildren(mapOf("active" to it, "updatedAt" to System.currentTimeMillis())) }) } } }
@Composable private fun LoadingScreen(text: String) { Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Column(horizontalAlignment = Alignment.CenterHorizontally) { CircularProgressIndicator(color = Mint); Spacer(Modifier.height(12.dp)); Text(text, color = Muted) } } }
@Composable private fun AccessDenied(message: String, onSignOut: () -> Unit) { Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) { Icon(Icons.Default.Lock, null, tint = Danger, modifier = Modifier.size(54.dp)); Spacer(Modifier.height(12.dp)); Text("ไม่มีสิทธิ์เข้าถึง", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold); Text(message, color = Muted); Spacer(Modifier.height(20.dp)); Button(onSignOut) { Text("ออกจากระบบ") } } }

private fun sendEpisode(uid: String, anime: String, name: String, episode: String, video: String, desc: String, cover: String, languages: List<String>, done: (String) -> Unit) {
    Thread {
        try {
            languages.forEach { language ->
                val payload = JSONObject().apply { put("anime", anime.trim()); put("name", name.trim()); put("episode", episode.trim()); put("title", language); put("video_url", video.trim()); put("desc", desc.trim()); put("cover", cover.trim()); put("adminUid", uid) }
                val connection = URL(API_URL).openConnection() as HttpURLConnection
                connection.requestMethod = "POST"; connection.doOutput = true; connection.setRequestProperty("Content-Type", "application/json")
                connection.outputStream.use { it.write(payload.toString().toByteArray()) }
                if (connection.responseCode !in 200..299) throw IllegalStateException("HTTP ${connection.responseCode}")
                connection.disconnect()
            }
            Handler(Looper.getMainLooper()).post { done("สำเร็จ: เพิ่ม ${languages.size} รายการแล้ว") }
        } catch (e: Exception) { Handler(Looper.getMainLooper()).post { done("ส่งไม่สำเร็จ: ${e.localizedMessage ?: "ตรวจสอบอินเทอร์เน็ต"}") } }
    }.start()
}
