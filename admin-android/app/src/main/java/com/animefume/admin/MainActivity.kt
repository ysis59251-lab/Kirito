package com.animefume.admin

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (FirebaseApp.getApps(this).isEmpty()) {
            FirebaseApp.initializeApp(this, FirebaseOptions.Builder()
                .setApiKey("PASTE_FIREBASE_API_KEY")
                .setApplicationId("PASTE_FIREBASE_APP_ID")
                .setProjectId("PASTE_FIREBASE_PROJECT_ID")
                .setGcmSenderId("PASTE_FIREBASE_MESSAGING_SENDER_ID")
                .build())
        }
        setContent { AdminApp() }
    }
}

@Composable
fun AdminApp() {
    val auth = remember { FirebaseAuth.getInstance() }
    val db = remember { FirebaseFirestore.getInstance() }
    var user by remember { mutableStateOf(auth.currentUser) }
    var email by remember { mutableStateOf("") }; var password by remember { mutableStateOf("") }
    var title by remember { mutableStateOf("") }; var category by remember { mutableStateOf("") }
    var published by remember { mutableStateOf(false) }; var message by remember { mutableStateOf("") }
    var titles by remember { mutableStateOf(listOf<String>()) }
    MaterialTheme { Surface(Modifier.fillMaxSize()) { Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("ANIMEFUME ADMIN", style = MaterialTheme.typography.headlineMedium)
        if (user == null) {
            Text("เข้าสู่ระบบผู้ดูแล")
            OutlinedTextField(email, { email = it }, label = { Text("อีเมล") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(password, { password = it }, label = { Text("รหัสผ่าน") }, modifier = Modifier.fillMaxWidth())
            Button(onClick = { auth.signInWithEmailAndPassword(email, password).addOnSuccessListener { user = it.user }.addOnFailureListener { message = "เข้าสู่ระบบไม่สำเร็จ" } }) { Text("เข้าสู่ระบบ") }
        } else {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text("จัดการเรื่อง"); TextButton(onClick = { auth.signOut(); user = null }) { Text("ออก") } }
            OutlinedTextField(title, { title = it }, label = { Text("ชื่อเรื่อง") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(category, { category = it }, label = { Text("หมวดหมู่") }, modifier = Modifier.fillMaxWidth())
            Row { Checkbox(published, { published = it }); Text("เผยแพร่บนเว็บ", Modifier.padding(top = 12.dp)) }
            Button(onClick = { if (title.isBlank()) { message = "กรอกชื่อเรื่องก่อน" } else { db.collection("catalog").add(mapOf("title" to title, "category" to category, "published" to published)).addOnSuccessListener { message = "บันทึกแล้ว"; title = ""; category = "" }.addOnFailureListener { message = "บันทึกไม่สำเร็จ" } } }) { Text("เพิ่มเรื่อง") }
            Text(message, color = MaterialTheme.colorScheme.primary)
            Text("รายการล่าสุด", style = MaterialTheme.typography.titleMedium)
            LazyColumn { items(titles) { Text(it, Modifier.padding(vertical = 6.dp)) } }
            LaunchedEffect(Unit) { db.collection("catalog").orderBy("title", Query.Direction.ASCENDING).addSnapshotListener { snap, _ -> titles = snap?.documents?.map { it.getString("title") ?: "ไม่มีชื่อ" } ?: emptyList() } }
        }
    } } }
}
