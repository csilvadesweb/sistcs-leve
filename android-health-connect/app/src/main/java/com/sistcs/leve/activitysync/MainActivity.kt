package com.sistcs.leve.activitysync

import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.text.InputType
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : ComponentActivity() {
    private lateinit var status: TextView
    private lateinit var details: TextView
    private lateinit var emailInput: EditText
    private lateinit var passwordInput: EditText
    private lateinit var connectButton: Button
    private var healthClient: HealthConnectClient? = null
    private var accountSession: SupabaseActivitySync.Session? = null
    private val syncApi = SupabaseActivitySync()

    private val permissionLauncher = registerForActivityResult(
        PermissionController.createRequestPermissionResultContract(),
    ) { granted ->
        if (granted.containsAll(HealthConnectReader.requiredPermissions())) {
            readAndSyncActivity()
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
            setPadding(40, 40, 40, 40)
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
        root.addView(TextView(this).apply {
            text = "Entre na sua conta SISTCS para sincronizar a atividade deste aparelho."
            textSize = 16f
            setPadding(0, 20, 0, 12)
        })
        emailInput = EditText(this).apply {
            hint = "E-mail da conta SISTCS"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
            setSingleLine(true)
        }
        passwordInput = EditText(this).apply {
            hint = "Senha da conta"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            setSingleLine(true)
        }
        status = TextView(this).apply {
            text = "A conexão solicita apenas leitura de passos e sessões de exercício."
            textSize = 16f
            setPadding(0, 20, 0, 12)
        }
        details = TextView(this).apply {
            text = "Os dados são enviados à sua conta com a sessão autenticada. Nenhuma chave administrativa é usada."
            textSize = 14f
        }
        connectButton = Button(this).apply {
            text = "Conectar e sincronizar"
            setOnClickListener { signInAndConnect() }
        }
        root.addView(emailInput)
        root.addView(passwordInput)
        root.addView(status)
        root.addView(details)
        root.addView(connectButton)
        setContentView(root)
    }

    private fun signInAndConnect() {
        connectButton.isEnabled = false
        status.text = "Autenticando sua conta…"
        lifecycleScope.launch {
            try {
                val session = withContext(Dispatchers.IO) {
                    syncApi.signIn(emailInput.text.toString(), passwordInput.text.toString())
                }
                accountSession = session
                passwordInput.text?.clear()
                val client = HealthConnectClient.getOrCreate(this@MainActivity)
                healthClient = client
                val granted = client.permissionController.getGrantedPermissions()
                val required = HealthConnectReader.requiredPermissions()
                if (granted.containsAll(required)) {
                    readAndSyncActivity()
                } else {
                    status.text = "Autorize a leitura de atividade"
                    permissionLauncher.launch(required)
                }
            } catch (error: Exception) {
                status.text = "Não foi possível conectar"
                details.text = error.message?.take(240) ?: "Confira sua conexão e tente novamente."
                connectButton.isEnabled = true
            }
        }
    }

    private fun readAndSyncActivity() {
        val client = healthClient ?: HealthConnectClient.getOrCreate(this).also { healthClient = it }
        val session = accountSession
        if (session == null) {
            status.text = "Entre na sua conta antes de sincronizar"
            connectButton.isEnabled = true
            return
        }
        connectButton.isEnabled = false
        status.text = "Lendo e sincronizando atividade…"
        lifecycleScope.launch {
            try {
                val summary = HealthConnectReader(client).readToday()
                val uploaded = withContext(Dispatchers.IO) { syncApi.upload(session, summary) }
                status.text = "${summary.steps} passos sincronizados hoje"
                val exercises = if (summary.exercises.isEmpty()) {
                    "Nenhuma sessão de exercício encontrada hoje."
                } else {
                    summary.exercises.joinToString(separator = "\n") {
                        "${it.type} — ${it.durationMinutes} min"
                    }
                }
                details.text = "Data: ${summary.date} (${summary.zoneId})\nRegistros enviados/atualizados: $uploaded\n\n$exercises\n\nAbra Perfil no SISTCS Leve para conferir a sincronização."
            } catch (_: SecurityException) {
                status.text = "Permissão revogada ou insuficiente"
                details.text = "Conceda novamente acesso a passos e exercícios no Health Connect."
            } catch (error: Exception) {
                status.text = "A sincronização não foi concluída"
                details.text = error.message?.take(240) ?: "Confira sua conexão e tente novamente."
            } finally {
                connectButton.isEnabled = true
            }
        }
    }
}
