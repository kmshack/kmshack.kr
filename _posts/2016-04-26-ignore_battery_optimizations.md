---
title: Android 앱에서 배터리 최적화 예외 요청하기
tags: 안드로이드
layout: post
legacy: true
---
Android 마시멜로에는 백그라운드 작업을 제한해 배터리 소모를 줄이는 최적화 기능이 추가되었다. 다만 웨어러블 연결이나 지속적인 동기화가 필요한 앱에서는 이 제한이 핵심 기능에 영향을 줄 수 있다. 이런 경우 사용자에게 배터리 최적화 예외를 요청하는 방법을 알아본다.  

구글도 이러한 문제로 인해 최근 배터리 최적화 목록에 안드로이드 웨어앱을 무시할 수 있는 간편한 설정 기능을 넣어두었으며 설정하지 않으면 지속적으로 나타나 설정해야 연결이 끊기지 않는다는 안내를 지속적으로 하게끔 업데이트 되었습니다.  

일반적으로 구글 레퍼런스 폰인 경우 `설정 > 배터리 > 배터리 최적화`에서 설정을 해야하며, 제조사별로 메뉴 위치나 설정 이름이 달라서 사용자들이 직접 설정하기는 힘든 부분입니다. 그렇기 때문에 안드로이드웨어앱은 자체적으로 다이얼로그를 통해 설정 기능을 넣었습니다.  

|:---------------:|
|<br> ![](/blog/images/2016-04-26-ignore_battery_optimizations/android_wear.png){:.center-image}  <br>|

<br>

## 어떻게? 
안드로이드 API 23에 배터리 최적화를 앱에서 직접 제어 할 수 있는 권한이 추가되었습니다.

```
android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
```
 

해당 권한을 선언하면 시스템 다이얼로그를 통해 앱을 배터리 최적화 예외 목록에 추가하도록 요청할 수 있다. Package 이름을 포함한 설정 액션을 보내면 된다.  

API Level 23에서 추가된 [PowerManager.isIgnoringBatteryOptimizations()](https://developer.android.com/reference/android/os/PowerManager.html?hl=ko#isIgnoringBatteryOptimizations(java.lang.String))를 이용하여 해당 앱이 배터리 최적화 상태인가를 확인할 수 있습니다. 그리고 `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` 액션을 이용하여 배터리 최적화를 무시할 수도 있습니다. 반대로 최적화 모드를 수행하기 위해서는 `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` 액션을 사용하면 됩니다.  

<br>
### 예제

``` java
Intent i = new Intent();

String packageName = getPackageName();
PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);

if (pm.isIgnoringBatteryOptimizations(packageName){
 i.setAction(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
} else {
 i.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
 i.setData(Uri.parse("package:" + packageName));
}
startActivity(i);
```
  
<br>

무시하는 액션을 수행하면 다이얼로그를 통해 사용자가 직접 배터리 최적화 무시를 할 수 있습니다.  
배터리 최적화 모드로 앱의 정상 작동에 문제가 된다면 앱에서 직접 배터리 최적화를 무시할 수 있도록 액션을 요청하여 다이얼로그를 통해 안내해주는 것도 하나의 방법이 될 것 같습니다. 단, 권한 추가로 부담은 있겠지만 앱이 정상 작동하지 않는것 보다는 감수해볼만한 사항입니다.  
