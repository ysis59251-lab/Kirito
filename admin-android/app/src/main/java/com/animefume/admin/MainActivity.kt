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
import org.json.JSONArray

private val Bg = Color(0xFF080B10)
private val Panel = Color(0xFF151B24)
private val Panel2 = Color(0xFF1D2733)
private val Mint = Color(0xFF35E0C1)
private val Warning = Color(0xFFFFC857)
private val Danger = Color(0xFFFF7B86)
private val Muted = Color(0xFF9AA7B5)
private const val API_URL = "https://script.google.com/macros/s/AKfycbxWBZkZyb5NRdMXLkBpwCX-zvDEc2BFSZFPzazKpyWsMSYlD0A7TL8GUP_Esy5MBbbNhg/exec"
private const val RTDB_URL = "https://mpmp-5864a-default-rtdb.firebaseio.com"
private const val CONTENT_API_URL = "https://opensheet.elk.sh/1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58/Sheet1"

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
    val tabs = listOf("ภาพรวม", "รายงาน", "ประกาศ", "จัดการอนิเมะ", "เพิ่มตอน", "ผู้ช่วย")
    Scaffold(topBar = { TopAppBar(title = { Column { Text("AnimeFume Admin", fontWeight = FontWeight.Bold); Text("${session.role} • ${session.email}", color = Muted, style = MaterialTheme.typography.labelSmall) } }, actions = { IconButton(onClick = onSignOut) { Icon(Icons.Default.Logout, "ออกจากระบบ") } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Bg)) }, bottomBar = { NavigationBar(containerColor = Panel) { tabs.forEachIndexed { index, label -> NavigationBarItem(selected = tab == index, onClick = { tab = index }, icon = { Icon(listOf(Icons.Default.Dashboard, Icons.Default.ReportProblem, Icons.Default.Campaign, Icons.Default.Layers, Icons.Default.VideoLibrary, Icons.Default.GroupAdd)[index], null) }, label = { Text(label) }) } } }, containerColor = Bg) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when (tab) {
                0 -> OverviewScreen(session)
                1 -> ReportsScreen()
                2 -> AnnouncementScreen(session.role)
                3 -> AnimeManagementScreen(session.role)
                4 -> AddEpisodeScreen(session.uid)
                else -> AssistantsScreen(session)
            }
        }
    }
}

@Composable
private fun OverviewScreen(session: AdminSession) {
    val database = remember { FirebaseDatabase.getInstance(RTDB_URL) }
    var online by remember { mutableStateOf<List<OnlineUser>>(emptyList()) }
    var reports by remember { mutableIntStateOf(0) }
    var maintenanceMode by remember { mutableStateOf(false) }
    var notificationsEnabled by remember { mutableStateOf(true) }
    var totalViews by remember { mutableLongStateOf(0L) }
    var controlStatus by remember { mutableStateOf<String?>(null) }
    var blockedSessions by remember { mutableStateOf<List<String>>(emptyList()) }
    var lastSync by remember { mutableLongStateOf(0L) }
    var showShutdownConfirm by remember { mutableStateOf(false) }
    DisposableEffect(Unit) {
        val onlineRef = database.getReference("onlineUsers")
        val reportsRef = database.getReference("reports")
        val maintenanceRef = database.getReference("settings/maintenanceMode")
        val notificationsRef = database.getReference("settings/notificationsEnabled")
        val viewsRef = database.getReference("animeViews")
        val blockedRef = database.getReference("blockedSessions")
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
        val maintenanceListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) { maintenanceMode = snapshot.getValue(Boolean::class.java) == true }
            override fun onCancelled(error: DatabaseError) {}
        }
        val notificationsListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) { notificationsEnabled = snapshot.getValue(Boolean::class.java) != false }
            override fun onCancelled(error: DatabaseError) {}
        }
        val viewsListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) { totalViews = snapshot.children.sumOf { it.getValue(Long::class.java) ?: 0L } }
            override fun onCancelled(error: DatabaseError) {}
        }
        val blockedListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) { blockedSessions = snapshot.children.filter { it.getValue(Boolean::class.java) == true }.mapNotNull { it.key }.sorted() }
            override fun onCancelled(error: DatabaseError) {}
        }
        onlineRef.addValueEventListener(onlineListener); reportsRef.addValueEventListener(reportsListener); maintenanceRef.addValueEventListener(maintenanceListener); notificationsRef.addValueEventListener(notificationsListener); viewsRef.addValueEventListener(viewsListener); blockedRef.addValueEventListener(blockedListener)
        onDispose { onlineRef.removeEventListener(onlineListener); reportsRef.removeEventListener(reportsListener); maintenanceRef.removeEventListener(maintenanceListener); notificationsRef.removeEventListener(notificationsListener); viewsRef.removeEventListener(viewsListener); blockedRef.removeEventListener(blockedListener) }
    }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp), contentPadding = PaddingValues(bottom = 20.dp)) {
        item { Text("ศูนย์ควบคุมแบบเรียลไทม์", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold); Text("ข้อมูลอัปเดตทันทีจาก AnimeFume", color = Muted) }
        item { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) { MetricCard("ออนไลน์", online.size.toString(), Mint, Modifier.weight(1f)); MetricCard("รายงานใหม่", reports.toString(), Danger, Modifier.weight(1f)); MetricCard("เข้าชม", totalViews.toString(), Warning, Modifier.weight(1f)) } }
        item { StatusCard("การเชื่อมต่อ", if (lastSync > 0) "เชื่อมต่อแล้ว • ${online.size} คนกำลังใช้งาน" else "กำลังเชื่อมต่อ…", lastSync > 0) }
        if (session.role == "owner") item {
            Card(colors = CardDefaults.cardColors(containerColor = if (maintenanceMode) Color(0xFF3A252A) else Panel), shape = RoundedCornerShape(18.dp)) {
                Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("ควบคุมหน้าจอผู้ชม", fontWeight = FontWeight.Bold)
                        Text(if (maintenanceMode) "เว็บไซต์กำลังแสดงหน้าปิดปรับปรุง" else "เว็บไซต์กำลังเปิดให้ผู้ชมใช้งาน", color = if (maintenanceMode) Warning else Muted, style = MaterialTheme.typography.bodySmall)
                    }
                    Switch(checked = maintenanceMode, onCheckedChange = { enabled ->
                        database.getReference("settings").updateChildren(mapOf(
                            "maintenanceMode" to enabled,
                            "systemState" to if (enabled) "stopped" else "running",
                            "updatedAt" to System.currentTimeMillis(),
                            "updatedBy" to session.email
                        )).addOnSuccessListener { controlStatus = if (enabled) "หยุดระบบผู้ชมแล้ว" else "เปิดเว็บไซต์ให้ผู้ชมแล้ว" }
                    })
                }
                Row(Modifier.fillMaxWidth().padding(start = 16.dp, end = 16.dp, bottom = 14.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("การแจ้งเตือนหน้าเว็บ", fontWeight = FontWeight.Bold)
                        Text(if (notificationsEnabled) "ผู้ชมเห็นประกาศที่เผยแพร่" else "ปิดการแสดงประกาศชั่วคราว", color = Muted, style = MaterialTheme.typography.bodySmall)
                    }
                    Switch(checked = notificationsEnabled, onCheckedChange = { enabled -> database.getReference("settings/notificationsEnabled").setValue(enabled).addOnSuccessListener { controlStatus = if (enabled) "เปิดการแจ้งเตือนแล้ว" else "ปิดการแจ้งเตือนแล้ว" } })
                }
                Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp).padding(bottom = 16.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedButton(onClick = {
                        database.getReference("onlineUsers").get().addOnSuccessListener { snapshot ->
                            val cutoff = System.currentTimeMillis() - 15_000L
                            var removed = 0
                            snapshot.children.forEach { child -> if ((child.child("time").getValue(Long::class.java) ?: 0L) < cutoff) { child.ref.removeValue(); removed++ } }
                            controlStatus = "ล้าง session ค้างแล้ว ${removed} รายการ"
                        }
                    }, modifier = Modifier.weight(1f)) { Text("ล้าง session ค้าง") }
                    if (controlStatus != null) Text(controlStatus!!, color = Mint, style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
                }
                Button(
                    onClick = { showShutdownConfirm = true },
                    colors = ButtonDefaults.buttonColors(containerColor = Danger),
                    modifier = Modifier.fillMaxWidth().padding(start = 16.dp, end = 16.dp, bottom = 16.dp)
                ) { Text("หยุดระบบทั้งหมด", fontWeight = FontWeight.Bold) }
            }
        }
        item { Text("ผู้ใช้ออนไลน์ล่าสุด", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold) }
        if (online.isEmpty()) item { EmptyCard("ยังไม่มีผู้ใช้งานออนไลน์") }
        items(online.take(20), key = { it.id }) { OnlineRow(it, database, session.role == "owner" || session.role == "admin") }
        if (session.role == "owner") {
            item { Text("ผู้ชมที่ถูกบล็อก", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold) }
            if (blockedSessions.isEmpty()) item { EmptyCard("ยังไม่มี session ที่ถูกบล็อก") }
            items(blockedSessions, key = { it }) { blockedId ->
                Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(14.dp)) {
                    Row(Modifier.fillMaxWidth().padding(13.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) { Text(blockedId, fontWeight = FontWeight.Bold); Text("บล็อกอยู่ • ต้องให้ผู้ชมรีเฟรชหลังปลดบล็อก", color = Muted, style = MaterialTheme.typography.bodySmall) }
                        TextButton(onClick = { database.getReference("blockedSessions/$blockedId").removeValue(); database.getReference("onlineUsers/$blockedId").removeValue(); controlStatus = "ปลดบล็อกแล้ว: $blockedId" }) { Text("ปลดบล็อก", color = Mint) }
                    }
                }
            }
        }
    }
    if (showShutdownConfirm) {
        AlertDialog(
            onDismissRequest = { showShutdownConfirm = false },
            title = { Text("ยืนยันหยุดระบบทั้งหมด") },
            text = { Text("เว็บจะเข้าสู่โหมดปิดปรับปรุงทันที วิดีโอ เสียง iframe และการกดใช้งานของผู้ชมจะถูกหยุดทั้งหมด คุณสามารถเปิดกลับได้จากสวิตช์เดิม") },
            confirmButton = {
                TextButton(onClick = {
                    showShutdownConfirm = false
                    database.getReference("settings").updateChildren(mapOf(
                        "maintenanceMode" to true,
                        "systemState" to "stopped",
                        "notificationsEnabled" to false,
                        "updatedAt" to System.currentTimeMillis(),
                        "updatedBy" to session.email,
                        "shutdownAt" to System.currentTimeMillis()
                    )).addOnSuccessListener { controlStatus = "หยุดระบบทั้งหมดแล้ว" }
                        .addOnFailureListener { controlStatus = "หยุดระบบไม่สำเร็จ: ${it.localizedMessage ?: "ตรวจสอบสิทธิ์ Firebase"}" }
                }) { Text("ยืนยันหยุดระบบ", color = Danger) }
            },
            dismissButton = { TextButton(onClick = { showShutdownConfirm = false }) { Text("ยกเลิก") } }
        )
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

data class ManagedAnime(val id: String, val title: String, val image: String, val year: String, val link: String)

@Composable
private fun AnimeManagementScreen(role: String) {
    val db = remember { FirebaseDatabase.getInstance(RTDB_URL) }
    var items by remember { mutableStateOf<List<ManagedAnime>>(emptyList()) }
    var overrides by remember { mutableStateOf<Map<String, String>>(emptyMap()) }
    var query by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(true) }
    var status by remember { mutableStateOf<String?>(null) }
    DisposableEffect(Unit) {
        val ref = db.getReference("contentOverrides")
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) { overrides = snapshot.children.mapNotNull { child -> child.key?.let { it to (child.child("action").getValue(String::class.java) ?: "") } }.toMap() }
            override fun onCancelled(error: DatabaseError) { status = "อ่านสถานะรายการไม่ได้: ${error.message}" }
        }
        ref.addValueEventListener(listener)
        Thread {
            try {
                val connection = URL(CONTENT_API_URL).openConnection() as HttpURLConnection
                connection.requestMethod = "GET"; connection.connectTimeout = 15000; connection.readTimeout = 20000; connection.setRequestProperty("User-Agent", "Mozilla/5.0 AnimeFumeAdmin/3.0")
                val text = connection.inputStream.bufferedReader().use { it.readText() }
                val json = JSONArray(text)
                val parsed = buildList {
                    for (i in 0 until json.length()) {
                        val row = json.optJSONObject(i) ?: continue
                        val id = row.optString("id").trim().ifBlank { row.optString("anime").trim() }
                        val title = row.optString("title").trim().ifBlank { row.optString("name").trim() }
                        val hiddenInSheet = row.optString("Show").equals("TRUE", ignoreCase = true)
                        if (id.isNotBlank() && title.isNotBlank() && !hiddenInSheet) add(ManagedAnime(id, title, row.optString("image").ifBlank { row.optString("cover") }, row.optString("year"), row.optString("link").ifBlank { row.optString("video_url") }))
                    }
                }
                Handler(Looper.getMainLooper()).post { items = parsed.distinctBy { it.id }; loading = false }
                connection.disconnect()
            } catch (error: Exception) { Handler(Looper.getMainLooper()).post { loading = false; status = "โหลดรายการอนิเมะไม่สำเร็จ: ${error.localizedMessage ?: "ตรวจสอบอินเทอร์เน็ต"}" } }
        }.start()
        onDispose { ref.removeEventListener(listener) }
    }
    val visible = items.filter { query.isBlank() || it.title.contains(query, true) || it.id.contains(query, true) }
    LazyColumn(Modifier.fillMaxSize().padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp), contentPadding = PaddingValues(bottom = 24.dp)) {
        item { Text("จัดการอนิเมะ", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold); Text("ซ้ายคือรายการจากเว็บ • ขวาคือซ่อน ลบ หรือกู้คืน โดยไม่ลบข้อมูลต้นฉบับ", color = Muted); Spacer(Modifier.height(8.dp)); OutlinedTextField(query, { query = it }, Modifier.fillMaxWidth(), label = { Text("ค้นหาอนิเมะ") }, singleLine = true) }
        if (loading) item { LoadingScreen("กำลังโหลดรายการอนิเมะ…") }
        if (!loading && visible.isEmpty()) item { EmptyCard("ไม่พบรายการอนิเมะ") }
        items(visible, key = { it.id }) { item ->
            val action = overrides[item.id].orEmpty()
            Card(colors = CardDefaults.cardColors(containerColor = if (action.isBlank()) Panel else Panel2), shape = RoundedCornerShape(14.dp)) {
                Row(Modifier.fillMaxWidth().padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) { Text(item.title, fontWeight = FontWeight.Bold); Text("${item.id}${item.year.takeIf { it.isNotBlank() }?.let { " • $it" } ?: ""}", color = Muted, style = MaterialTheme.typography.bodySmall); if (action.isNotBlank()) Text(if (action == "hidden") "ซ่อนอยู่" else "ทำเครื่องหมายลบ", color = Warning, style = MaterialTheme.typography.labelSmall) }
                    if (role == "owner" || role == "admin") Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                        TextButton(onClick = { db.getReference("contentOverrides/${item.id}").setValue(mapOf("action" to "hidden", "updatedAt" to System.currentTimeMillis())); status = "ซ่อนแล้ว: ${item.title}" }) { Text("ซ่อน", color = Warning) }
                        TextButton(onClick = { db.getReference("contentOverrides/${item.id}").setValue(mapOf("action" to "deleted", "updatedAt" to System.currentTimeMillis())); status = "นำออกจากเว็บแล้ว: ${item.title}" }) { Text("ลบ", color = Danger) }
                        if (action.isNotBlank()) TextButton(onClick = { db.getReference("contentOverrides/${item.id}").removeValue(); status = "กู้คืนแล้ว: ${item.title}" }) { Text("กู้คืน", color = Mint) }
                    }
                }
            }
        }
        if (status != null) item { Text(status!!, color = Mint, style = MaterialTheme.typography.bodySmall) }
    }
}

@Composable
private fun OverlayScreen(role: String) {
    val db = remember { FirebaseDatabase.getInstance(RTDB_URL) }
    var title by remember { mutableStateOf("") }
    var image by remember { mutableStateOf("") }
    var caption by remember { mutableStateOf("") }
    var active by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf<String?>(null) }
    DisposableEffect(Unit) {
        val ref = db.getReference("siteConfig/overlay")
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) { title = snapshot.child("title").getValue(String::class.java).orEmpty(); image = snapshot.child("image").getValue(String::class.java).orEmpty(); caption = snapshot.child("caption").getValue(String::class.java).orEmpty(); active = snapshot.child("active").getValue(Boolean::class.java) == true }
            override fun onCancelled(error: DatabaseError) { status = "อ่าน Overlay ไม่สำเร็จ: ${error.message}" }
        }
        ref.addValueEventListener(listener)
        onDispose { ref.removeEventListener(listener) }
    }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp), contentPadding = PaddingValues(bottom = 24.dp)) {
        item { Text("Overlay บนหน้าจอผู้ชม", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold); Text("แสดงภาพและข้อความอนิเมะทับบนทุกหน้าผู้ชมแบบเรียลไทม์", color = Muted) }
        if (role == "owner") item { Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(18.dp)) { Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) { EpisodeField("ชื่อ Overlay", title) { title = it }; EpisodeField("ลิงก์รูปภาพอนิเมะ", image, KeyboardType.Uri) { image = it }; EpisodeField("ข้อความใต้ภาพ", caption) { caption = it }; Row(verticalAlignment = Alignment.CenterVertically) { Switch(checked = active, onCheckedChange = { active = it }); Spacer(Modifier.width(8.dp)); Text(if (active) "กำลังแสดง" else "ซ่อนอยู่", color = if (active) Mint else Muted) }; Button({ db.getReference("siteConfig/overlay").setValue(mapOf("active" to active, "title" to title.trim(), "image" to image.trim(), "caption" to caption.trim(), "updatedAt" to System.currentTimeMillis())); status = if (active) "เผยแพร่ Overlay แล้ว" else "ซ่อน Overlay แล้ว" }, enabled = !active || image.isNotBlank(), modifier = Modifier.fillMaxWidth()) { Text("บันทึก Overlay") }; if (status != null) Text(status!!, color = Mint) } } }
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
        if (session.role == "owner") item { Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(18.dp)) { Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) { EpisodeField("Firebase UID", uid) { uid = it }; EpisodeField("อีเมลสำหรับแสดงผล", email, KeyboardType.Email) { email = it }; Button({ val cleanUid = uid.trim(); try { db.getReference("adminUsers/$cleanUid").updateChildren(mapOf("active" to true, "role" to "admin", "email" to email.trim())).addOnSuccessListener { status = "เพิ่มผู้ช่วยแล้ว" }.addOnFailureListener { status = "เพิ่มไม่สำเร็จ: ${it.localizedMessage ?: "ตรวจสอบสิทธิ์ Firebase"}" }; uid = ""; email = "" } catch (error: IllegalArgumentException) { status = "UID ไม่ถูกต้อง: ห้ามมี . # $ [ ] หรือ /" } }, enabled = uid.isNotBlank() && uid.none { it == '.' || it == '#' || it == '$' || it == '[' || it == ']' || it == '/' }, modifier = Modifier.fillMaxWidth()) { Text("เพิ่มผู้ช่วย") }; if (status != null) Text(status!!, color = Mint) } } }
        items(assistants, key = { it.uid }) { assistant -> Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(14.dp)) { Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically) { Icon(if (assistant.role == "owner") Icons.Default.VerifiedUser else Icons.Default.Person, null, tint = if (assistant.role == "owner") Warning else Mint); Spacer(Modifier.width(10.dp)); Column(Modifier.weight(1f)) { Text(assistant.email.ifBlank { assistant.uid }, fontWeight = FontWeight.Bold); Text("${assistant.role} • active", color = Muted, style = MaterialTheme.typography.bodySmall) }; if (session.role == "owner" && assistant.uid != session.uid) TextButton({ db.getReference("adminUsers/${assistant.uid}").updateChildren(mapOf("active" to false)) }) { Text("ปิดสิทธิ์", color = Danger) } } } }
    }
}

@Composable private fun EpisodeField(label: String, value: String, type: KeyboardType = KeyboardType.Text, onValueChange: (String) -> Unit) { OutlinedTextField(value, onValueChange, Modifier.fillMaxWidth(), label = { Text(label) }, singleLine = label != "เรื่องย่อ", keyboardOptions = KeyboardOptions(keyboardType = type)) }
@Composable private fun MetricCard(label: String, value: String, color: Color, modifier: Modifier) { Card(modifier, colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(16.dp)) { Column(Modifier.padding(14.dp)) { Text(label, color = Muted); Text(value, color = color, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold) } } }
@Composable private fun StatusCard(label: String, value: String, ok: Boolean) { Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(16.dp)) { Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically) { Icon(if (ok) Icons.Default.CloudDone else Icons.Default.CloudOff, null, tint = if (ok) Mint else Warning); Spacer(Modifier.width(10.dp)); Column { Text(label, fontWeight = FontWeight.Bold); Text(value, color = Muted, style = MaterialTheme.typography.bodySmall) } } } }
@Composable private fun EmptyCard(message: String) { Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(16.dp)) { Text(message, Modifier.fillMaxWidth().padding(18.dp), color = Muted) } }
@Composable private fun OnlineRow(user: OnlineUser, database: FirebaseDatabase, canModerate: Boolean) { Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(14.dp)) { Column(Modifier.fillMaxWidth().padding(13.dp)) { Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Person, null, tint = Mint); Spacer(Modifier.width(10.dp)); Column(Modifier.weight(1f)) { Text(user.title.ifBlank { "ไม่ระบุหน้า" }, fontWeight = FontWeight.Bold); Text(user.page, color = Muted, style = MaterialTheme.typography.bodySmall); Text(user.id, color = Muted, style = MaterialTheme.typography.labelSmall) } }; if (canModerate) Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) { TextButton(onClick = { database.getReference("onlineUsers/${user.id}").updateChildren(mapOf("kicked" to true, "commandAt" to System.currentTimeMillis())) }) { Text("เตะออก", color = Warning) }; TextButton(onClick = { database.getReference("onlineUsers/${user.id}").updateChildren(mapOf("blocked" to true, "commandAt" to System.currentTimeMillis())); database.getReference("blockedSessions/${user.id}").setValue(true) }) { Text("บล็อก", color = Danger) } } } } }
@Composable private fun ReportCard(report: ReportItem, database: FirebaseDatabase) { Card(colors = CardDefaults.cardColors(containerColor = if (report.read) Panel else Panel2), shape = RoundedCornerShape(14.dp)) { Column(Modifier.padding(14.dp)) { Row(verticalAlignment = Alignment.CenterVertically) { Text(report.page.ifBlank { "ไม่ระบุหน้า" }, Modifier.weight(1f), fontWeight = FontWeight.Bold); Text(if (report.read) "อ่านแล้ว" else "ใหม่", color = if (report.read) Muted else Warning, style = MaterialTheme.typography.labelSmall) }; Text(report.detail, Modifier.padding(top = 6.dp)); Text(report.meta, color = Muted, style = MaterialTheme.typography.bodySmall); Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) { if (!report.read) TextButton({ database.getReference("reports/${report.id}").updateChildren(mapOf("read" to true)) }) { Text("อ่านแล้ว") }; TextButton({ database.getReference("reports/${report.id}").removeValue() }) { Text("ลบ", color = Danger) } } } } }
@Composable private fun AnnouncementCard(item: Announcement, database: FirebaseDatabase, canEdit: Boolean) { Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(14.dp)) { Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically) { Column(Modifier.weight(1f)) { Text(item.title, fontWeight = FontWeight.Bold); Text(item.body, color = Muted, style = MaterialTheme.typography.bodySmall); Text(if (item.active) "กำลังแสดง" else "ปิดอยู่", color = if (item.active) Mint else Muted, style = MaterialTheme.typography.labelSmall) }; if (canEdit) Switch(item.active, { database.getReference("siteConfig/announcement").updateChildren(mapOf("active" to it, "updatedAt" to System.currentTimeMillis())) }) } } }
@Composable private fun LoadingScreen(text: String) { Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Column(horizontalAlignment = Alignment.CenterHorizontally) { CircularProgressIndicator(color = Mint); Spacer(Modifier.height(12.dp)); Text(text, color = Muted) } } }
@Composable private fun AccessDenied(message: String, onSignOut: () -> Unit) { Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) { Icon(Icons.Default.Lock, null, tint = Danger, modifier = Modifier.size(54.dp)); Spacer(Modifier.height(12.dp)); Text("ไม่มีสิทธิ์เข้าถึง", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold); Text(message, color = Muted); Spacer(Modifier.height(20.dp)); Button(onSignOut) { Text("ออกจากระบบ") } } }

private fun sendEpisode(uid: String, anime: String, name: String, episode: String, video: String, desc: String, cover: String, languages: List<String>, done: (String) -> Unit) {
    Thread {
        try {
            val cleanVideo = video.trim()
            val cleanCover = cover.trim()
            fun requireHttpUrl(value: String, label: String) {
                val parsed = URL(value)
                if (parsed.protocol !in listOf("http", "https") || parsed.host.isBlank()) throw IllegalArgumentException("$label ต้องเป็นลิงก์ http/https")
            }
            requireHttpUrl(cleanVideo, "ลิงก์วิดีโอ")
            if (cleanCover.isNotBlank()) requireHttpUrl(cleanCover, "ลิงก์รูปปก")
            if (episode.trim().toDoubleOrNull() == null || episode.trim().toDouble() < 0) throw IllegalArgumentException("ตอนต้องเป็นตัวเลขที่ไม่ติดลบ")
            var completed = 0
            languages.forEach { language ->
                val payload = JSONObject().apply { put("anime", anime.trim()); put("name", name.trim()); put("episode", episode.trim()); put("title", language); put("video_url", cleanVideo); put("desc", desc.trim()); put("cover", cleanCover); put("adminUid", uid) }
                val connection = URL(API_URL).openConnection() as HttpURLConnection
                connection.requestMethod = "POST"; connection.doOutput = true; connection.setRequestProperty("Content-Type", "application/json")
                connection.outputStream.use { it.write(payload.toString().toByteArray()) }
                if (connection.responseCode !in 200..299) throw IllegalStateException("HTTP ${connection.responseCode}")
                connection.disconnect()
                completed++
            }
            Handler(Looper.getMainLooper()).post { done("สำเร็จ: เพิ่ม $completed รายการแล้ว") }
        } catch (e: Exception) { Handler(Looper.getMainLooper()).post { done("ส่งไม่สำเร็จ: ตรวจสอบข้อมูลและอินเทอร์เน็ต (${e.localizedMessage ?: "ไม่ทราบสาเหตุ"})") } }
    }.start()
}
