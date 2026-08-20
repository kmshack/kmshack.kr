---
title: AppUpdateManager를 이용한 앱 업데이트 처리
tags: [플레이스토어, 안드로이드]
layout: post
comments: true
---

어느 정도 규모가 있는 앱에는 사용자에게 최신버전의 업데이트를 알려주는 기능과 강제 업데이트 기능이 대부분 포함되어 있습니다. 강제 업데이트의 경우 중요한 문제로 인해 더이상 해당 버전을 사용하지못하고 최신버전을 받아 사용하기 원하는 경우에 사용됩니다. 대부분 Backend를 통해 현재 앱버전을 체크하여 업데이트해야 하는 상황에 따라 사용자에게 다이얼로그를 노출시키고 플레이스토어로 이동하는 방법을 사용합니다. 플레이스토어로 이동 후 사용자는 업데이트 버튼을 눌러 업데이트가 끝난뒤 다시 앱으로 돌아오게 됩니다.  

<br>

### 문제점
사용자는 플레이스토어로 이동하여 수동으로 업데이트 버튼을 눌러야하며, 업데이트가 끝날때 까지 기다려야 합니다. 업데이트시간이 오래걸리게 되면 이탈하게 되어 업데이트하고 있다는 사실을 인지하지 못하고 업데이트된 후 앱을 재 실행하지 않게 될 수 도 있습니다. 또한 베타/알파 테스터나 앱 출시를 단계적으로 배포 하게 될경우 해당 사용자는 플레이스토어로 이동해도 최신버전의 앱으로 업데이트 받지 못할 수도 있습니다.  

<br>

## AppUpdateManager
구글은 이런 오래된 업데이트 처리방식에 대해 지원 하기위해 `AppUpdateManager`를 라이브러리를 통해 추가하였습니다. AppUpdateManager를 이용하면 실제 업데이트 해야할지 질의할 수 있으며, 플레이스토어로 이동할 필요 없이 자연스러운 앱 업데이트를 처리 할 수 있습니다.  


### dependency
build.gradle에 아래와 같이 종속성을 추가합니다.  

```
implementation 'com.google.android.play:core:1.6.1’
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

`appUpdateInfo`를 가져오기 위해 `addOnCompleteListener`를 통한 Callback구조를 suspendCoroutine를 이용해 suspend 함수로 간단하게 만들수 있습니다.  

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
* UPDATE_AVAILABLE: 현재 최신버전이 아니며 업데이트가 필요한 경우
* UPDATE_NOT_AVAILABLE: 현재 최신버전이며 업데이트가 필요 하지 않은 경우

<br>

## 업데이트 수행하기
업데이트가 필요한 상황을 인지 했다면, 이제 실제로 앱 업데이트 동작을 수행하게 해야 합니다. 플레이스토어로 이동하는 방법이 아닌 `AppUpdateManager.startUpdateFlowForResult()`를 이용하여 2가지 타입의 업데이트 방법을 사용자에게 제공해 줄 수 있습니다.  

```java
appUpdateManager.startUpdateFlowForResult(
    appUpdateInfo,
    AppUpdateType.FLEXIBLE , // or AppUpdateType.IMMEDIATE
    activity,
    REQUEST_CODE_UPDATE)
```

<br>

## 즉시 업데이트
`AppUpdateType.IMMEDIATE` 타입을 사용하면 별도의 업데이트 UI를 표시하게 되며 사용자가 업데이트전 다른 작업을 하지 못하도록 블락시키게 됩니다. 강제 업데이트 해야 할 경우 적절합니다. 앱이 업데이트 되면 자동으로 어플리케이션이 자동으로 재시작됩니다. 업데이트가 완료 되는 경우 onActivityForResult()를 통해 결과를 확인 할 수 있습니다.

|:---------------:|
|<br> ![](/blog/images/2019-06-24-AppUpdateManager/immediate.jpg){:.center-image} <br>|

업데이트중에는 항상 업데이트 UI만 보여지게 하기위해서는 UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS 상태로 처리하면 됩니다. 

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
`AppUpdateType.FLEXIBLE` 타입을 사용하는 경우 사용자에게 좀 더 자연스럽게 업데이트를 처리 할 수 있습니다. 사용자가 업데이트를 누르면 DownloadManager를 통해 업데이트할 앱을 백그라운드를 통해 다운로드 받으며, 다운로드 완료가 되면 사용자에게 별도의 UI를 통해 알리고 설치 할 수 있도록 처리합니다.  

|:---------------:|
|<br> ![](/blog/images/2019-06-24-AppUpdateManager/flexible.jpg){:.center-image} <br>|

<br>

다운로드 진행사항을 `InstallStateUpdatedListener`를 통해 Callback받을 수 있습니다. 다운로드 완료시 사용자에게 방해가 안될 정도의 UI를 표시하여 설치를 유도합니다. 여기서는 Snackbar를 이용하였습니다.   `appUpdateManager.completeUpdate()`를 호출하면 설치 UI로 넘어가게 되며 설치 완료시 자동으로 어플리케이션이 재실행됩니다.  


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

사용가능한 새 버전이 있음에도 불구하고 특정 기기나 계정에서 새로운 버전을 사용할 수 없을 수 있습니다. 해당 업데이트가 실제 구글 플레이앱에서 제공되는지 여부를 확인 하는것이 중요합니다. `appUpdateInfo.isUpdateTypeAllowed()`를 이용하면 실제로 업데이트 가능한지 확인 할 수 있습니다.  


<br>


참고:  
[https://developer.android.com/guide/app-bundle/in-app-updates](https://developer.android.com/guide/app-bundle/in-app-updates)  
[https://proandroiddev.com/theres-a-new-update-available-75a2c5bda76e](https://proandroiddev.com/theres-a-new-update-available-75a2c5bda76e)









