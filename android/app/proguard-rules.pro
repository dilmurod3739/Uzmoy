# UZMOY Proguard rules
-keep class uz.uzmoy.app.** { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-dontwarn android.webkit.**
