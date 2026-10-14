package com.sistcs.leve.activitysync

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.activity.ComponentActivity

/**
 * Tela exigida pelo Health Connect: sem uma Activity que responda a
 * ACTION_SHOW_PERMISSIONS_RATIONALE / VIEW_PERMISSION_USAGE, o sistema recusa
 * automaticamente o pedido de permissão ("Permissões não concedidas").
 */
class PermissionsRationaleActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val pad = (20 * resources.displayMetrics.density).toInt()
        val column = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(pad, pad, pad, pad)
        }
        column.addView(TextView(this).apply {
            text = "Como usamos seus dados de atividade"
            textSize = 20f
        })
        column.addView(TextView(this).apply {
            text = "O SISTCS Leve lê apenas seus passos e suas sessões de exercício no Health Connect " +
                "e envia para a sua conta, usando a sua sessão autenticada, para mostrar sua atividade " +
                "no app. Nenhum outro dado de saúde é lido. Você pode revogar a permissão a qualquer " +
                "momento nas configurações do Health Connect e pode excluir seus dados no app."
            textSize = 16f
            setPadding(0, pad / 2, 0, pad / 2)
        })
        column.addView(Button(this).apply {
            text = "Política de privacidade"
            setOnClickListener {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://leve.sistcs.com/#/privacidade")))
            }
        })
        setContentView(ScrollView(this).apply { addView(column) })
    }
}
