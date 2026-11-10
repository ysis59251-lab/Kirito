package com.animefume.admin

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

private val Bg = Color(0xFF080B10)
private val Panel = Color(0xFF151B24)
private val Mint = Color(0xFF35E0C1)
private val Muted = Color(0xFF9AA7B5)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { AnimeFumeAdminApp() }
    }
}

@Composable
private fun AnimeFumeAdminApp() {
    var user by remember { mutableStateOf(FirebaseAuth.getInstance().currentUser) }
    var allowed by remember { mutableStateOf<Boolean?>(null) }
    var role by remember { mutableStateOf("admin") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    fun verifyAdmin(uid: String) {
        busy = true
        FirebaseFirestore.getInstance().collection("adminUsers").document(uid).get()
            .addOnSuccessListener { doc ->
                allowed = doc.exists() && doc.getBoolean("active") == true
                role = doc.getString("role") ?: "admin"
                busy = false
                if (allowed != true) error = "บัญชีนี้ยังไม่ได้รับสิทธิ์ผู้ดูแลระบบ"
            }
            .addOnFailureListener {
                allowed = false
                busy = false
                error = "ตรวจสอบสิทธิ์ไม่สำเร็จ กรุณาตรวจ Firestore Rules และการเชื่อมต่อ"
            }
    }

    LaunchedEffect(user?.uid) {
        allowed = null
        error = null
        user?.uid?.let { verifyAdmin(it) }
    }

    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Mint,
            background = Bg,
            surface = Panel,
            onBackground = Color.White,
            onSurface = Color.White
        )
    ) {
        Surface(Modifier.fillMaxSize(), color = Bg) {
            when {
                user == null -> LoginScreen(
                    busy = busy,
                    error = error,
                    onLogin = { email, password ->
                        busy = true
                        error = null
                        FirebaseAuth.getInstance().signInWithEmailAndPassword(email.trim(), password)
                            .addOnCompleteListener { task ->
                                busy = false
                                if (task.isSuccessful) user = FirebaseAuth.getInstance().currentUser
                                else error = task.exception?.localizedMessage ?: "เข้าสู่ระบบไม่สำเร็จ"
                            }
                    }
                )
                busy || allowed == null -> CenterMessage("กำลังตรวจสอบสิทธิ์ผู้ดูแล…")
                allowed == true -> AdminDashboard(role) {
                    FirebaseAuth.getInstance().signOut()
                    user = null
                    allowed = null
                }
                else -> AccessDenied(error ?: "ไม่มีสิทธิ์เข้าใช้งาน") {
                    FirebaseAuth.getInstance().signOut()
                    user = null
                    allowed = null
                }
            }
        }
    }
}

@Composable
private fun LoginScreen(
    busy: Boolean,
    error: String?,
    onLogin: (String, String) -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    Box(
        Modifier.fillMaxSize().background(
            Brush.linearGradient(listOf(Color(0xFF101D26), Bg, Color(0xFF1C1020)))
        ).padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            Modifier.fillMaxWidth().widthIn(max = 440.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(Icons.Default.AdminPanelSettings, null, tint = Mint, modifier = Modifier.size(58.dp))
            Spacer(Modifier.height(12.dp))
            Text("ANIMEFUME", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
            Text("ADMIN CONSOLE", color = Mint, style = MaterialTheme.typography.labelLarge)
            Spacer(Modifier.height(28.dp))
            Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(24.dp)) {
                Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Text("เข้าสู่ระบบผู้ดูแล", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    OutlinedTextField(email, { email = it }, Modifier.fillMaxWidth(), label = { Text("อีเมล") }, singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email))
                    OutlinedTextField(password, { password = it }, Modifier.fillMaxWidth(), label = { Text("รหัสผ่าน") }, singleLine = true, visualTransformation = PasswordVisualTransformation())
                    if (error != null) Text(error, color = Color(0xFFFF7B86), style = MaterialTheme.typography.bodySmall)
                    Button(
                        onClick = { onLogin(email, password) },
                        enabled = !busy && email.isNotBlank() && password.isNotBlank(),
                        modifier = Modifier.fillMaxWidth().height(50.dp)
                    ) {
                        if (busy) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                        else Text("เข้าสู่ระบบ")
                    }
                    Text("อนุญาตเฉพาะบัญชีที่เจ้าของระบบเพิ่มสิทธิ์ไว้เท่านั้น", color = Muted, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AdminDashboard(role: String, onSignOut: () -> Unit) {
    val sections = listOf(
        Triple("จัดการอนิเมะ", "เพิ่ม แก้ไข และซ่อนรายการอนิเมะ", Icons.Default.Movie),
        Triple("จัดการตอน", "จัดการตอนและแหล่งเล่นวิดีโอ", Icons.Default.VideoLibrary),
        Triple("ผู้ใช้งาน", "ตรวจสอบบัญชีและสถานะผู้ใช้", Icons.Default.People),
        Triple("ประกาศ", "สร้างและจัดการประกาศหน้าเว็บ", Icons.Default.Campaign),
        Triple("สถิติ", "ภาพรวมการเข้าชมและการใช้งาน", Icons.Default.QueryStats),
        Triple("บันทึกกิจกรรม", "ตรวจสอบการกระทำของผู้ดูแล", Icons.Default.History),
        Triple("ตั้งค่าระบบ", "ค่าทั่วไปและการเชื่อมต่อ", Icons.Default.Settings)
    )
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Column { Text("AnimeFume Admin", fontWeight = FontWeight.Bold); Text("สิทธิ์: $role", color = Muted, style = MaterialTheme.typography.labelSmall) } },
                actions = { IconButton(onClick = onSignOut) { Icon(Icons.Default.Logout, "ออกจากระบบ") } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Bg)
            )
        },
        containerColor = Bg
    ) { padding ->
        LazyColumn(
            Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            item {
                Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(20.dp)) {
                    Column(Modifier.padding(18.dp)) {
                        Text("ศูนย์ควบคุมระบบ", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        Text("จัดการ AnimeFume จากแอปแยกโดยไม่ต้องเข้าเว็บไซต์หลัก", color = Muted)
                        Spacer(Modifier.height(8.dp))
                        Text("สถานะบัญชี: ยืนยันสิทธิ์แล้ว", color = Mint, style = MaterialTheme.typography.labelMedium)
                    }
                }
            }
            items(sections.size) { index ->
                val item = sections[index]
                Card(
                    colors = CardDefaults.cardColors(containerColor = Panel),
                    shape = RoundedCornerShape(18.dp)
                ) {
                    Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(item.third, null, tint = Mint, modifier = Modifier.size(28.dp))
                        Spacer(Modifier.width(14.dp))
                        Column(Modifier.weight(1f)) {
                            Text(item.first, fontWeight = FontWeight.Bold)
                            Text(item.second, color = Muted, style = MaterialTheme.typography.bodySmall)
                        }
                        Text("เร็วๆ นี้", color = Muted, style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
        }
    }
}

@Composable
private fun AccessDenied(message: String, onSignOut: () -> Unit) {
    Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(Icons.Default.Lock, null, tint = Color(0xFFFF7B86), modifier = Modifier.size(54.dp))
        Spacer(Modifier.height(12.dp))
        Text("ไม่มีสิทธิ์เข้าถึง", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text(message, color = Muted)
        Spacer(Modifier.height(20.dp))
        Button(onClick = onSignOut) { Text("ออกจากระบบ") }
    }
}

@Composable
private fun CenterMessage(message: String) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = Mint)
            Spacer(Modifier.height(12.dp))
            Text(message, color = Muted)
        }
    }
}
