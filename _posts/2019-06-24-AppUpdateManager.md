---
title: AppUpdateManager로 인앱 업데이트 처리하기
tags: [Play 스토어, 안드로이드]
layout: post
legacy: true
---

앱 업데이트를 안내하기 위해 자체 버전 확인 로직과 Play 스토어 이동 화면을 구현하는 경우가 많다. `AppUpdateManager`를 사용하면 사용자가 앱을 벗어나지 않고 업데이트를 진행하는 인앱 업데이트 흐름을 구성할 수 있다. 즉시 업데이트와 유연한 업데이트의 차이와 기본 구현 방법을 살펴본다.  

<br>

### 문제점
기존 방식에서는 사용자가 Play 스토어로 이동해 업데이트 버튼을 누르고, 설치가 끝난 뒤 앱으로 돌아와야 한다. 업데이트 시간이 길면 흐름에서 이탈할 수 있고, 단계적 배포 중에는 계정이나 기기에 새 버전이 아직 제공되지 않을 수도 있다.  

<br>

## AppUpdateManager
Google은 이런 업데이트 흐름을 개선하기 위해 Play Core 라이브러리에 `AppUpdateManager`를 추가했다. 업데이트 가능 여부를 확인하고 Play 스토어로 이동하지 않은 채 인앱 업데이트를 진행할 수 있다.  


### dependency
build.gradle에 아래와 같이 종속성을 추가합니다.  

```
implementation 'com.google.android.play:core:1.6.1'
```

<br>

## 업데이트 체크하기
AppUpdateManager를 통해 `appUpdateInfo`로 현재 업데이트 상태를 가져올 수 있습니다.  

```java
val appUpdateManager = AppUpdateManagerFactory.create(this)
  
launch{
  val appUpdateInfo = appUpdateManager.appUpdateInfo.await()
  
  when(appUpdateInfo.updateAvailability()){
      UpdateAvailability.UPDATE_AVAILABLE ->{
         //업데이트 가능한 상태
      }
  }
}
```
<br>

`appUpdateInfo`를 가져오는 콜백 구조는 `suspendCoroutine`을 이용해 suspend 함수로 감쌀 수 있다.  

```java
suspend fun Task<AppUpdateInfo>.await(): AppUpdateInfo {
    return suspendCoroutine { continuation ->
        addOnCompleteListener { result ->
            if (result.isSuccessful) {
                continuation.resume(result.result)
            } else {
                continuation.resumeWithException(result.exception)
            }
        }
    }
}
```

<br>

### UpdateAvailability 4가지 상태
* DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS : AppUpdateType.IMMEDIATE 타입을 통해 업데이트를 수행중인 경우
* UNKNOWN: 알수 없음
* UPDATE_AVAILABLE: 현재 최신 버전이 아니며 업데이트가 필요한 경우
* UPDATE_NOT_AVAILABLE: 현재 최신 버전이며 업데이트가 필요 하지 않은 경우

<br>

## 업데이트 수행하기
업데이트 가능 여부를 확인했다면 `AppUpdateManager.startUpdateFlowForResult()`로 업데이트를 시작한다. 두 가지 업데이트 유형 중 상황에 맞는 방식을 선택할 수 있다.  

```java
appUpdateManager.startUpdateFlowForResult(
    appUpdateInfo,
    AppUpdateType.FLEXIBLE , // or AppUpdateType.IMMEDIATE
    activity,
    REQUEST_CODE_UPDATE)
```

<br>

## 즉시 업데이트
`AppUpdateType.IMMEDIATE` 타입을 사용하면 별도의 업데이트 UI를 표시하게 되며 사용자가 업데이트전 다른 작업을 하지 못하도록 블락시키게 됩니다. 강제 업데이트 해야 할 경우 적절합니다. 앱이 업데이트 되면 자동으로 애플리케이션이 자동으로 재시작됩니다. 업데이트가 완료 되는 경우 onActivityForResult()를 통해 결과를 확인할 수 있습니다.

|:---------------:|
|<br> ![](/blog/images/2019-06-24-AppUpdateManager/immediate.jpg){:.center-image} <br>|

업데이트 중에는 항상 업데이트 UI가 표시되도록 `UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS` 상태를 처리하면 된다.

```java
override fun onResume() {
    super.onResume()
    appUpdateManager.appUpdateInfo
        .addOnSuccessListener {
            if (it.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
                appUpdateManager.startUpdateFlowForResult(
                    it,
                    AppUpdateType.IMMEDIATE,
                    activity,
                    REQUEST_CODE_UPDATE)
            }
        }
}
```
<br>

## 자연스러운 업데이트
`AppUpdateType.FLEXIBLE`을 사용하면 사용자가 앱을 계속 이용하는 동안 업데이트 파일을 백그라운드에서 내려받을 수 있다. 다운로드가 끝나면 별도의 UI로 완료 사실을 알리고 설치를 진행한다.  

|:---------------:|
|<br> ![](/blog/images/2019-06-24-AppUpdateManager/flexible.jpg){:.center-image} <br>|

<br>

다운로드 진행 상태는 `InstallStateUpdatedListener`로 받을 수 있다. 다운로드가 끝나면 Snackbar처럼 방해가 적은 UI로 설치를 안내하고, `appUpdateManager.completeUpdate()`를 호출해 설치를 진행한다.  


```java
val listener = InstallStateUpdatedListener {
    if (it.installStatus() == InstallStatus.DOWNLOADED) {
        Snackbar.make(coordinator_layout, "업데이트 버전 다운로드 완료", Snackbar.LENGTH_INDEFINITE)
                .setAction("설치/재시작", View.OnClickListener {
                    appUpdateManager.completeUpdate()
                }).show()
    }
}
appUpdateManager.registerListener(listener)
```

<br>

새 버전이 있어도 특정 기기나 계정에는 아직 업데이트가 제공되지 않을 수 있다. 해당 업데이트 유형을 실제로 사용할 수 있는지 `appUpdateInfo.isUpdateTypeAllowed()`로 확인해야 한다.


<br>


참고:  
[https://developer.android.com/guide/app-bundle/in-app-updates](https://developer.android.com/guide/app-bundle/in-app-updates)  
[https://proandroiddev.com/theres-a-new-update-available-75a2c5bda76e](https://proandroiddev.com/theres-a-new-update-available-75a2c5bda76e)





