---
title: WorkManager로 정기적인 백그라운드 작업 수행하기
tags: 안드로이드 서비스
layout: post
legacy: true
---

Android O부터 백그라운드 서비스와 암시적 브로드캐스트에는 여러 제약이 적용된다. 즉시 실행할 필요는 없지만 완료가 보장되어야 하는 작업을 `WorkManager`로 예약하고, 주기적으로 실행하는 방법을 살펴본다.  

<br>

WorkManager는 Android Jetpack의 일부로 1.0.0버전으로 얼마전 공개되었습니다. Google은 이미 `JobScheduler`, `Firebase JobDispatcher`와 같은 백그라운드 작업을 위한 라이브러리를 수차례 공개하였습니다. 또한 Evernote의 `Android Job`이 있습니다. WorkManager는 이미 공개된 라이브러리보다 많은 장점이 있습니다.

* 이전 버전과의 호환성(API14이상 모두 지원)
* Google Play Service에 대한 의존성이 없음
* 체인 기반의 작업 관리
* 작업 상태 쿼리가능
  
<br>
## 이제 프로젝트에 적용해봅시다!  
  
항상 그렇듯 build.gradle에 종속성을 추가합니다.  

```
allprojects {
    repositories {
        google()
        jcenter()
    }
}
```

```
dependencies {
    def work_version = 1.0.0

    // (Java only)
    implementation "android.arch.work:work-runtime:$work_version"

    // Kotlin + coroutines
    implementation "android.arch.work:work-runtime-ktx:$work_version"

}
```

<br>
백그라운드에서 일부 작업을 실행하는 예제를 보도록하겠습니다. 현재 좌표를 하루에 두번씩 서버로 전송하는 예제이며, 몇 가지 제약조건이 추가됩니다. 기기가 Wi-Fi에 연결되어 있고 저장 용량이 부족하지 않은 경우에만 작동합니다.


```java
class LocationWorker(context: Context, workerParams: WorkerParameters) 
    : Worker(context, workerParams) {
    
    ...
    
    override fun doWork(): Result {
        
        val latitude = inputData.getDouble(KEY_LATITUDE, 40.1903484)
        val longitude = inputData.getDouble(KEY_LONGITUDE, 44.5148367)
        
        val sendDataService = SendDataService.getInstance()
        sendDataService.sendLocation(latitude, longitude)
            .addSuccessCallback {
            
            }
            .addFailureCallback {
            
            }

        return Result.success()
    }
}
```  

<br>
Worker가 생성되고, 주기적으로 실행되는 작업 공간의 큐에 추가됩니다.  

```java
fun createConstraints() = Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.UNMETERED)  //와이파이 연결된 경우
                        // 다른값(NOT_REQUIRED, CONNECTED, NOT_ROAMING, METERED)
                        .setRequiresBatteryNotLow(true)                 // 배터리가 부족하지 않는 경우
                        .setRequiresStorageNotLow(true)                 // 저장소가 부족하지 않는 경우
                        .build()

fun createWorkRequest(data: Data) = PeriodicWorkRequestBuilder<LocationWorker>(12, TimeUnit.HOURS)// 12시간 반복
                .setInputData(data) // 입력 데이터                                                  
                .setConstraints(createConstraints()) // 작업을 재시도 할경우에 대한 정책
                .setBackoffCriteria(BackoffPolicy.LINEAR, 
                                PeriodicWorkRequest.MIN_BACKOFF_MILLIS, TimeUnit.MILLISECONDS)
                .build()

fun startWork() {
    // 입력 데이터를 설정합니다. Bundle와 동일합니다.
    val work = createWorkRequest(Data.EMPTY)
    
    /* 작업을 큐에 넣을때 동일한 작업인 경우에 대한 정책을 지정할 수 있습니다. 
    ExistingPeriodicWorkPolicy.KEEP은 동일한 작업을 큐에 넣게되며, 
    ExistingPeriodicWorkPolicy.REPLACE인 경우 작업이 대체됩니다. */
    WorkManager.getInstance().enqueueUniquePeriodicWork("Smart work", ExistingPeriodicWorkPolicy.KEEP, work)
    
    // 작업의 상태를 LiveData를 통해 관찰하게 됩니다. 
    WorkManager.getInstance().getWorkInfoByIdLiveData(work.id)
        .observe(lifecycleOwner, Observer { workInfo ->
            if (workInfo != null && workInfo.state == WorkInfo.State.SUCCEEDED) {
                // 작업 완료
            }
        })
}
```  

<br>
앞서 WorkManager의 장점으로 소개 했던 체인 기반의 작업에 대해서도 알아 보겠습니다.   

```java
fun chainWorks(filter1: Work, filter2: Work, compress: Work, upload: Work) {
  WorkManager.getInstance()
    // Worker를 동시에 병렬로 실행합니다.
    .beginWith(listOf(filter1, filter2))
    // 이전 beginWith의 모든 작업이 끝난 경우 실행됩니다.
    .then(compress)
    //compress작업이 완료 된경우 upload가 실행됩니다.
    .then(upload)
    //enqueue()를 호출해야 이 모든 작업이 실행됩니다.
    .enqueue()
}
```

<br>

|:---------------:|
|<br> ![](/blog/images/2019-03-18-work_manager/worker_manager.png){:.center-image} <br>|


<br>
`Worker`는 우리가 원했던 작업구현 방식입니다. doWork() 메서드에서 필요한 작업을 구현하면 됩니다.  

`WorkRequest`는 Worker의 arguments(입력된 데이터)와 constraints(네트워크 연결) 작업을 당담합니다.   

`WorkManager`는 WorkRequest를 큐에 담고 작업을 시작합니다. 이 작업을 스케쥴링 하기 위해 `Room 데이터베이스`에 저장 하는 가장 좋은 방법을 사용합니다. 이 작업 결과는 LiveData를 통해 전송됩니다.  

<br>
## 결론
WorkManager는 앱이 종료되거나 기기가 재시작되어도 실행되며, 비동기 작업을  구현하는 가장간단하면서 효과적인 솔루션입니다. 또한 제약사항을 통해 앱의 소비전력도 줄일 수 있습니다.  

<br>


참고:  
[https://medium.com/@RobertLevonyan/android-workmanager-manage-periodic-tasks-c13fa7744ebd](https://medium.com/@RobertLevonyan/android-workmanager-manage-periodic-tasks-c13fa7744ebd)
[https://developer.android.com/topic/libraries/architecture/workmanager](https://developer.android.com/topic/libraries/architecture/workmanager)








