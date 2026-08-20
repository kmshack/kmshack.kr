---
title: Kotlin Coroutines 사용 패턴
tags: [안드로이드, 코틀린, 코루틴]
layout: post
comments: true
---

## async 호출을 감싸서 핸들링 하는 경우 coroutineScope또는 SupervisorJob을 사용하자.  

async 블록이 예외를 throw하는 경우 try/catch블록으로 감싸는 것만으로 모든 예외를 처리 할수 있다는 것에 신뢰하면 안됩니다.  

```java
val job: Job = Job()
val scope = CoroutineScope(Dispatchers.Default + job)
// may throw Exception
fun doWork(): Deferred<String> = scope.async { ... }   // (1)
fun loadData() = scope.launch {
    try {
        doWork().await()                               // (2)
    } catch (e: Exception) { ... }
}
```

위의 예제에서 doWork() 함수는 처리되지 않는 예외를 throw할 수 있는 새로운 코루틴(1)을 시작합니다. try/catch 블록(2)으로 doWork() 함수를 감싸게 되면 충돌이 발생합니다.  

이는 자식 Job이 실패 하는 경우 부모도 즉각적으로 실패 해버리기때문에 발생하는 문제입니다.  

충돌을 피할 수 있는 한 가지의 방법은 `SupervisorJob`을 사용하는 것입니다.  

자식의 실패또는 취소로 인해 Job이 실패 되지 않으며 이로 인해 다른 자녀들에게 영향을 주지않게 됩니다.  

```java
val job = SupervisorJob()                               // (1)
val scope = CoroutineScope(Dispatchers.Default + job)
// may throw Exception
fun doWork(): Deferred<String> = scope.async { ... }
fun loadData() = scope.launch {
    try {
        doWork().await()
    } catch (e: Exception) { ... }
}
```

참고: 이 기능은 SupervisorJob으로 코루틴 범위에서 비동기를 명시적으로 실행하는 경우에만 작동합니다. async가 부모 코루틴(1)의 범위에서 시작되었기 때문에 아래 코드는 여전히 크래시가 납니다.  

```java
val job = SupervisorJob()                               
val scope = CoroutineScope(Dispatchers.Default + job)
fun loadData() = scope.launch {
    try {
        async {                                         // (1)
            // may throw Exception 
        }.await()
    } catch (e: Exception) { ... }
}
```

크래시를 피하는 또 다른 방법은 `coroutineScope`(1)을 사용하여 async를 감싸서 사용하는 방법이 있습니다. 이로 인해 async 내부에서 예외가 발생하면 외부 범위를 건드리지 않고 이 범위에서 작성된 다른 모든 coroutine만 취소 됩니다.(2)  

```java
val job = SupervisorJob()                               
val scope = CoroutineScope(Dispatchers.Default + job)
// may throw Exception
fun doWork(): Deferred<String> = coroutineScope {     // (1)
    async { ... }
}
fun loadData() = scope.launch {                       // (2)
    try {
        doWork().await()
    } catch (e: Exception) { ... }
}
```

<br>

## 루트 코루틴은 Main 디스패처를 선호하자.  

백그라운드 코루틴에서 백그라운드 작업을 수행하고 UI업데이트를 해야 하는 경우 Main 디스패처에서 실행해야 합니다.

```java
val scope = CoroutineScope(Dispatchers.Default)          // (1)
fun login() = scope.launch {
    withContext(Dispatcher.Main) { view.showLoading() }  // (2)  
    networkClient.login(...)
    withContext(Dispatcher.Main) { view.hideLoading() }  // (2)
}
```

위의 예에서 기본 디스패처(1)에서 코루틴을 실행합니다. 이 접근 방식을 사용하면 UI를 터치 할때 마다 Main 디스패처로 컨텍스트를 전환해야 합니다.(2)

이런 경우 Main 디스패처로 코루틴을 실행 하는 것이 코드가 훨씬 단순해지며 컨텍스트 전환이 더 명확해집니다.

```java
val scope = CoroutineScope(Dispatchers.Main)
fun login() = scope.launch {
    view.showLoading()    
    withContext(Dispatcher.IO) { networkClient.login(...) }
    view.hideLoading()
}
```

<br>

## 불필요한 async/await 사용을 피하자.

async 함수를 사용하고 즉시 await하는 경우라면 코드를 당장 걷어내야합니다.

```java
launch {
    val data = async(Dispatchers.Default) { /* code */ }.await()
}
```

만약 코루틴 컨텍스트를 바꾸고 즉시 중단하고 싶다면 withContext를 사용하는 것이 훨씬 좋은 방법이 될 수 있습니다.

```java
launch {
    val data = withContext(Dispatchers.Default) { /* code */ }
}
```

포퍼먼스 측면으로는 큰 문제는 아니지만( 심지어 async가 작업을 수행하기위해 새로운 코루틴을 생성해도) 의미론적으로 async 하다는 것은 백그라운드에서 여러개의 코루틴을 시작한 뒤 기다리고 있음을 의미하기때문에 적절하지 않습니다.

<br>

## scope Job을 취소하지 말자.

코루틴을 취소해야 하는 경우 스코프 작업을 취소하면 안됩니다.

```java
class WorkManager {
    val job = SupervisorJob()
    val scope = CoroutineScope(Dispatchers.Default + job)
    fun doWork1() {
        scope.launch { /* do work */ }
    }
    fun doWork2() {
        scope.launch { /* do work */ }
    }
    fun cancelAllWork() {
        job.cancel()
    }
}
fun main() {
    val workManager = WorkManager()
    workManager.doWork1()
    workManager.doWork2()
    workManager.cancelAllWork()
    workManager.doWork1() // (1)
}
```

위의 코드의 문제는 작업을 취소할 때 완료 상태로 만들어 버리는 것에 있습니다. 이미 완료된 작업 범위에서 실행된 코루틴은 재 실행되지 않습니다. (1)

특정 범위의 모든 코루틴을 취소하기위해서는 `cancelChildren` 함수를 사용할 수 있습니다. 또한 개별 작업 취소기능을 제공합니다.(2)

```java
class WorkManager {
    val job = SupervisorJob()
    val scope = CoroutineScope(Dispatchers.Default + job)
    fun doWork1(): Job = scope.launch { /* do work */ } // (2)
    fun doWork2(): Job = scope.launch { /* do work */ } // (2)
    fun cancelAllWork() {
        scope.coroutineContext.cancelChildren()         // (1)                             
    }
}
fun main() {
    val workManager = WorkManager()
    workManager.doWork1()
    workManager.doWork2()
    workManager.cancelAllWork()
    workManager.doWork1()
}
```

<br>

## 분명하지 않은 디스패처는 suspend 함수로 작성하지 말자.

명백한 코루틴 디스패처에 대한 실행인 경우 suspend 함수로 작업하지 않아야 합니다. 

```java
suspend fun login(): Result {
    view.showLoading()
    val result = withContext(Dispatcher.IO) {  
        someBlockingCall() 
    }
    view.hideLoading()
    return result
}
```

위의 예제는 로그인하는 기능으로 Main 디스패처가 아닌 곳에서 실행하면 크래시를 발생하는 suspend 함수 입니다. 

```java
launch(Dispatcher.Main) {     // (1) no crash
    val loginResult = login()
    ...
}
launch(Dispatcher.Default) {  // (2) cause crash
    val loginResult = login()
    ...
}
```

`CalledFromWrongThreadException` 생성된 원래 스레드에서만 해당 뷰를 제어해야 합니다. 

suspend 함수는 어떠한 코루틴 디스패처에 대해 실행할 수 있도록 디자인되어야합니다.

```java
suspend fun login(): Result = withContext(Dispatcher.Main) {
    view.showLoading()
    val result = withContext(Dispatcher.IO) {  
        someBlockingCall() 
    }
    view.hideLoading()
    return result
}
```

이제 모든 디스패처에서 로그인 기능을 실행할 수 있습니다.

```java
launch(Dispatcher.Main) {     // (1) no crash
    val loginResult = login()
    ...
}
launch(Dispatcher.Default) {  // (2) no crash ether
    val loginResult = login()
    ...
}
```

<br>

## GlobalScope 사용을 피하자.

만일 안드로이드 어플리케이션에서 `GlobalScope`를 사용하고 있다면 당장 사용을 중단해야 합니다.
 
```java
GlobalScope.launch {
    // code
}
```

GlobalScope는 전체 어플리케이션 수명 동안에 작동하고, 취소되지 않는 최상위 수준의 동시 처리를 시작하는데 사용됩니다.

별로도 정의한 `CoroutineScope`를 사용해야하며 async를 사용하거나 GlobalScope 인스턴스에서 실행하는 것이 좋습니다.

안드로이드에서 코루틴은 Activity, Fragment, View 또는 ViewModel의 수명주기로 쉽게 범위를 지정할 수 있습니다.

```java
class MainActivity : AppCompatActivity(), CoroutineScope {

    private val job = SupervisorJob()

    override val coroutineContext: CoroutineContext
        get() = Dispatchers.Main + job

    override fun onDestroy() {
        super.onDestroy()
        coroutineContext.cancelChildren()
    }
    
    fun loadData() = launch {
        // code
    }
}
```  

<br>
참고: [https://proandroiddev.com/kotlin-coroutines-patterns-anti-patterns-f9d12984c68e](https://proandroiddev.com/kotlin-coroutines-patterns-anti-patterns-f9d12984c68e)




















