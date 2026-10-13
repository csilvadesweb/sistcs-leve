package com.sistcs.leve.activitysync

import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import java.time.format.DateTimeFormatter
import java.time.ZoneId

class MainActivity : ComponentActivity() {
    private lateinit var status: TextView
    private lateinit var details: TextView
    private lateinit var connectButton: Button
    private var healthClient: HealthConnectClient? = null

    private val permissionLauncher = registerForActivityResult(
        PermissionController.createRequestPermissionResultContract(),
    ) { granted ->
        if (granted.containsAll(HealthConnectReader.requiredPermissions())) {
            readActivity()
        } else {
            status.text = "Permissões não concedidas"
            details.text = "Nenhum dado foi enviado. Conceda as permissões e tente novamente."
            connectButton.isEnabled = true
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        render()
        if (HealthConnectClient.getSdkStatus(this) != HealthConnectClient.SDK_AVAILABLE) {
            status.text = "Health Connect não está disponível"
            details.text = "Instale ou atualize o Health Connect no Android e abra este app novamente."
            connectButton.isEnabled = false
        }
    }

    private fun render() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(40, 48, 40, 40)
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
        }
        root.addView(TextView(this).apply {
            text = "SISTCS Leve"
            textSize = 28f
            gravity = Gravity.CENTER
        })
        status = TextView(this).apply {
            text = "Conecte ao Health Connect para ler seus dados de atividade."
            textSize = 17f
            setPadding(0, 28, 0, 16)
        }
        details = TextView(this).apply {
            text = "A leitura acontece neste aparelho. Esta versão ainda não envia dados para sua conta SISTCS."
            textSize = 15f
        }
        connectButton = Button(this).apply {
            text = "Conectar e ler atividade"
            setOnClickListener { requestPermissionsAndRead() }
        }
        root.addView(status)
        root.addView(details)
        root.addView(connectButton)
        setContentView(root)
    }

    private fun requestPermissionsAndRead() {
        if (HealthConnectClient.getSdkStatus(this) != HealthConnectClient.SDK_AVAILABLE) {
            status.text = "Health Connect não está disponível"
            connectButton.isEnabled = false
            return
        }
        val client = HealthConnectClient.getOrCreate(this)
        healthClient = client
        lifecycleScope.launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                val required = HealthConnectReader.requiredPermissions()
                if (granted.containsAll(required)) readActivity() else permissionLauncher.launch(required)
            } catch (_: Exception) {
                status.text = "Não foi possível verificar as permissões"
                details.text = "Abra o Health Connect, confira as permissões e tente novamente."
                connectButton.isEnabled = true
            }
        }
    }

    private fun readActivity() {
        val client = healthClient ?: HealthConnectClient.getOrCreate(this).also { healthClient = it }
        connectButton.isEnabled = false
        status.text = "Lendo atividade..."
        lifecycleScope.launch {
            try {
                val summary = HealthConnectReader(client).readToday()
                status.text = "${summary.steps} passos hoje"
                val exercises = if (summary.exercises.isEmpty()) {
                    "Nenhuma sessão de exercício encontrada hoje."
                } else {
                    summary.exercises.joinToString(separator = "\n") {
                        val start = DateTimeFormatter.ofPattern("HH:mm")
                            .withZone(ZoneId.of(summary.zoneId)).format(it.start)
                        "• ${it.type} — $start — ${it.durationMinutes} min"
                    }
                }
                details.text = "Data: ${summary.date} (${summary.zoneId})\n\n$exercises\n\nLeitura local concluída. Ainda não há sincronização com a conta SISTCS."
            } catch (_: SecurityException) {
                status.text = "Permissão revogada ou insuficiente"
                details.text = "Conceda novamente acesso a passos e exercícios no Health Connect."
            } catch (_: Exception) {
                status.text = "Falha ao ler os dados"
                details.text = "Confira se o Health Connect tem dados disponíveis e tente novamente."
            } finally {
                connectButton.isEnabled = true
            }
        }
    }
}
