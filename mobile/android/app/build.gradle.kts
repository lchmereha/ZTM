import java.io.FileInputStream
import java.util.Properties

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// key.properties fica fora do versionamento (ver svn:global-ignores), então
// máquinas de CI e clones novos não o têm. O bloco `signingConfigs` é avaliado
// em TODA build — inclusive debug — por isso a ausência do arquivo precisa ser
// tratada aqui, e não só no load.
val keystorePropertiesFile = rootProject.file("key.properties")
val hasSigningConfig = keystorePropertiesFile.exists()
val keystoreProperties =
    Properties().apply {
        if (hasSigningConfig) {
            FileInputStream(keystorePropertiesFile).use { load(it) }
        }
    }

android {
    namespace = "com.zztech.ztm"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = "com.zztech.ztm"
        // minSdk 24, targetSdk/compileSdk 36 — resolvidos pelo Flutter SDK.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (hasSigningConfig) {
            create("release") {
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
                storeFile = keystoreProperties.getProperty("storeFile")?.let { file(it) }
                storePassword = keystoreProperties.getProperty("storePassword")
            }
        }
    }

    buildTypes {
        release {
            // Sem keystore o release sai NÃO ASSINADO de propósito: assinar com
            // a chave de debug (o que o template do Flutter faz) produziria um
            // artefato que parece publicável mas é rejeitado pela Play Store.
            signingConfig =
                if (hasSigningConfig) {
                    signingConfigs.getByName("release")
                } else {
                    logger.warn(
                        "AVISO: android/key.properties ausente — o build de release sairá NÃO ASSINADO.",
                    )
                    null
                }
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")
    implementation(files("libs/DeviceAPI_ver20231208_release.aar"))
    implementation(files("libs/honeywell_rfid_sdk.aar"))
    implementation(files("libs/platform_sdk_v4.1.0326.jar"))
    implementation("com.google.android.material:material:1.14.0")
}
