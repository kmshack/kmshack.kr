---
title: Kotlin Coroutines – Retrofit2 + Coroutines 동시처리
tags: [안드로이드, 코틀린]
layout: post
comments: true
---

Android의 스레딩 모델은 UI 스레드라고 불리는 싱글 스레드가 사용자의 인터페이스 렌더링, 이벤트 캡쳐 및 기타 여러 측면을 담당하는데 이는 모든 UI 프레임워크와 동일합니다. 네트워크 요청, DB 쿼리, 많은 연산과 같은 긴 작업을 수행하면 UI가 멈추어 ANR 오류가 발생합니다.

<br>
## 우리는 이런 문제를 해결 하기위해서 아래와 같은 몇가지 방식을 사용합니다.
1. AsyncTask – 순서대로 짧은 연산 실행, 동시에 수행 할 수 있음
2. Executors – 고정된 스레드 풀과 동시에 작업 실행
3. Intent Service – 순서대로 긴 연산을 실행, 큐잉 처리함
4. RxJava – 가장 인기 있으며, 안드로이드 프레임워크에서 지원하지 않음
5. Raw Threads

위의 방식은 훌륭하지만 올바르게 사용하기 위해선 미묘한 차이를 보입니다. 또, 디버깅과 취소처리가 간단하지 않습니다.

<br>
## Kotlin Coroutines

코틀린 코루틴는 순차적으로 일어나는 일을 비동기 처리하기위한 방법입니다. 코루틴을 생성하는 것은 스레드를 만드는 것에 비해 비용이 적게듭니다. 그 이유는
>코루틴은 컴파일 기술을 통해 완벽하게 구현됩니다. (VM 또는 OS측면에서 지원이 필요없습니다). Suspend는 코드 변환을 통해 작동합니다.

코루틴은 여전히 실험단계에 있으며, 이는 API가 앞으로 변화될 가능성을 의미합니다. 하지만 JetBrains은 이전 버전과 같은 호환성을 제공할것 이라고 약속했습니다. ([여기를 통해 확인 해보세요.](https://stackoverflow.com/questions/46240236/can-experimental-kotlin-coroutines-be-used-in-production))

<br>
## Code

코루틴을 사용하기위해서 함수를 suspend로 표시해야 모든 정상기능을 사용할 수 있습니다. 이러한 기능을 사용하기위해 실행및 비동기화(Launch & Async)하는 코루틴 빌더가 필요합니다.

<br>
## Launch & Async

- Launch – 현재 스레드를 차단하지 않고 새로운 코루틴을 싱행하고 코루틴을 제거하는데 사용 할 수 있는 작업으로 코루틴에 대한 참조를 반환합니다.
- Async – 새로운 코루틴을 실행하고 지연후 결과를 반환합니다.

```java
public actual fun launch(
    context: CoroutineContext = DefaultDispatcher,
    start: CoroutineStart = CoroutineStart.DEFAULT,
    parent: Job? = null,
    block: suspend CoroutineScope.() -> Unit
): Job {
    val newContext = newCoroutineContext(context, parent)
    val coroutine = if (start.isLazy)
        LazyStandaloneCoroutine(newContext, block) else
        StandaloneCoroutine(newContext, active = true)
    coroutine.start(start, coroutine, block)
    return coroutine
}

public actual fun <T> async(
    context: CoroutineContext = DefaultDispatcher,
    start: CoroutineStart = CoroutineStart.DEFAULT,
    parent: Job? = null,
    block: suspend CoroutineScope.() -> T
): Deferred<T> {
    val newContext = newCoroutineContext(context, parent)
    val coroutine = if (start.isLazy)
        LazyDeferredCoroutine(newContext, block) else
        DeferredCoroutine<T>(newContext, active = true)
    coroutine.start(start, coroutine, block)
    return coroutine
}
```

<br>
- CoroutineContext – 코루틴 빌더가 실행되는 스레드를 정의합니다.
- DefaultDispatcher – CommonPool을 사용합니다. 개발자는 실행해야하는 스레드를 지정할 수있는 모든 권한을가집니다. 다른 옵션은 UI 스레드에서 실행되는 UI입니다.
- CoroutineStart – 시작 방법 정의
    - DEFAULT - 즉시 실행을 시작
    - LAZY - 코루틴을 느리게 시작
    - ATOMIC - 자동으로 최적화된 방법으로 시작
    - UNDISPATCHED - 분산 처리방법으로 시작

<br>
### 예제

**연속적으로 처리하는 작업**
```java
 private lateinit var job1: Job
    suspend fun getThingsDone(myThings: Int): Int {
        // Heavy computation going on here :D
        return myThings + 99
    }

    suspend fun getThingsDoneAgain(myThings: Int): Int {
        // Heavy computation going on here :D
        return myThings + 50
    }
    
    fun toDoWorkSerially() {
        job1 = launch(UI) {
            try {
                val work1 = async { getThingsDone(23) }
                val work2 = async { getThingsDoneAgain(55) }
                
                val result1 = work1.await()
                tvResult1.text = result1.toString()
                
                val result2 = work2.await()
                tvResult2.text = result2.toString()
            
            } catch (exception: Exception) {
                exception.printStackTrace()
            }
        }
    }
```
UI (Main Thread)는 Context를 사용하여 새로운  코루틴 Launch를 만듭니다. 이 과정에서 백그라운드에서 무거운 작업을 수행하고 UI 스레드에서 두 개의 다른 코루틴을 실행합니다. Async는 새로운 코루틴을 생성하고 지연된것을 리턴하여 기다릴 수 있게 됩니다.

간단히 말해 코드는 work1과 work2가 실행될 때 순차적으로 실행되고 result1은 work1이 완료 될 때까지 기다린 다음 result2는 work2가 완료 될 때까지 기다립니다. result1과 result2는 기본 스레드인 CommonPool을 Context로 사용했기 때문에 백그라운드 스레드에서 가져옵니다. 모든 예외는 해당 try catch 블록에서 발견됩니다.

<br>
**동시에 처리 하는 작업**
```java
private lateinit var job2: Job

fun toDoWorkConcurrent() {
    job2 = launch {
        try {
            val work1 = async { getThingsDone(43) }
            val work2 = async { getThingsDoneAgain(123) }

            val result = computeResult(work1.await(), work2.await())

            withContext(UI) {
                tvResult1.text = result.toString()
            }

        } catch (exception: Exception) {
            exception.printStackTrace()
        }
    }
}

private fun computeResult(await: Int, await1: Int): Int {
    return await + await1
}
    
```

위의 변수의 결과는 동시에 work1과 work2가 완료 될때만 이용할 수 있습니다.  이를 위해 await() 호출시 지연된 모든 객체가 호출됩니다.

코루틴 취소는 Job에서 cancel()을 통해 간단히 호출할 수 있습니다.

<br>
## Retrofit2 + Coroutines
코루틴을 Retrofit2와 함께 사용하기 위해서는 Retrofit2 Kotlin Coroutines Adapter 라이브러리를 이용하여 Service 메소드의 반환 유형으로 Deferred 타입을 사용할 수 있습니다.

```java
class LoginRepository @Inject constructor(private val apiService: APIService, private val sharedPreferences: SharedPreferences) {

    fun getOTPForNumber(phoneNumber: String): LiveData<OTPResult> {
    
        val loginResult = MutableLiveData<OTPResult>()
        launch {
            try {
                val request = apiService.getOTPForNumber(phoneNumber)
                val response = request.await()
                if (response.isSuccessful) {
                    loginResult.postValue(OTPResult.Success(response.message()))
                } else {
                    loginResult.postValue(OTPResult.Error(response.code(), response.message()))
                }
            } catch (exception: Exception) {
                loginResult.postValue(OTPResult.Exception(exception))
            }
        }
        return loginResult
    }
    
   fun getMyThings(date: String, meal: Triple<String, String, Boolean>): LiveData<DispatchesResult> {

        val dispatchResult = MutableLiveData<DispatchesResult>()
        launch {
            try {
                val task1 = apiService.getDispatches(id, date, meal.first)
                val task2 = apiService.getDispatches(id, date, meal.second)
                val task3 = apiService.checkAppDetails()
                checkResult(task1.await(), task2.await(), task3.await(), dispatchResult)

            } catch (exception: Exception) {
                dispatchResult.postValue(DispatchesResult.Exception(exception))
            }
        }

        return dispatchResult
    }

     private fun checkResult() {
        if (task1.isSuccessful && task2.isSuccessful && (task3.isSuccessful && task3.body()?.code == 1000)) {
        
        }
    }
}
```
apiService 인터페이스가 기존 Call대신 Deferred를 반환하기 때문에 이를 통해 이전에 다룬 코루틴을 그대로 사용할 수 있습니다.

<br>
## 결론
코루틴을 사용하면 코드를 쉽게 읽을 수 있는 비동기 코드 작성이 가능하며, 오류및 유지 보수를 줄 일 수 있습니다. 또한 코드의 경량화는 말할것도 없습니다.


























