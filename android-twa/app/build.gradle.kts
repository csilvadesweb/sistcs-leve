plugins {
    id("com.android.application")
}
android {
    namespace = "com.sistcs.leve.app"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.sistcs.leve"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }
    signingConfigs {
        // Chave de distribuição direta (APK instalado fora da Play Store). Ela é pública de propósito:
        // o app é só uma janela para https://leve.sistcs.com e não guarda dados nem segredos.
        // Para publicar na Play Store, gere uma chave privada própria (veja README).
        create("direct") {
            storeFile = file("sistcs-leve-twa.jks")
            storePassword = "sistcs-leve-twa"
            keyAlias = "sistcsleve"
            keyPassword = "sistcs-leve-twa"
        }
    }
    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("direct")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
dependencies {
    implementation(platform("org.jetbrains.kotlin:kotlin-bom:1.8.22"))
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.5.0")
}
