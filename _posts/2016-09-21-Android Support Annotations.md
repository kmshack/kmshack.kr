---
layout: post
title: Android Support Annotations
tags: 안드로이드
comments: true
---

안드로이드 개발 시 Annotation을 사용할 수 있도록 서포트 라이브러리를 지원한다. Annotation을 통해 코드의 설명을 간단명료하게 표시할 뿐 아니라 제약할 수도 있다. 즉, 해당 메서드나 멤버 변수를 다른 사람 또는 내가 재사용할 때 필요한 규약을 지정하여 예외적인 사항을 컴파일 에러를 통해 바로 확인이 가능하다.

<br>
#### 왜 사용해야 하는가?  
런타임시 발생되는 예외사항을 빌드 전 컴파일 에러를 통해 대부분 막을 수 있기때문에 앱의 개발 속도 향상은 물론 코드를 설명하기위한 긴 설명의 주석을 대체할 수 있다. 또한 다른 사람이 작성한 코드를 사용하거나 반대로 내가 작성한 코드를 다른사람이 사용하거나 분석할때 시간을 줄 일 수 있다.  

**안드로이드 Annotation 라이브러리 추가(build.gradle)**
```
dependencies { 
    compile 'com.android.support:support-annotations:24.2.0' 
}
```  

<br>
### @NonNull / @Nullable  
메서드의 파라미터에 null이 허용되는 경우도 있고, 반드시 값이 필요한 경우도 있다. 자신이 개발한 코드가 아니거나 또는 개발을 했음에도 코드를 살펴보고 null체크를 하는지 판단을 해야 하는 경우 사용하면 된다. 파라미터에 @NonNull을 사용하면 null값을 허용하지 않으며, 임으로 null을 넣는 경우 컴파일 에러가 난다. 반대로 메서드 내부적으로 null체크를 하여 해당 기능을 분기하는 경우 null이 허용 가능함으로 @Nullable를 사용하면 된다.  

<br>
### @CheckResilt
메서드의 리턴 값을 필수적으로 받아야 할 때 사용하면 된다.  

<br>
### @StringRes / @DrawableRes / @ColorRes / @(Etc)Res
메서드에 전달 인자가 리소스 주소인 Integer인 경우 해당 리소스가 어떠한 형태인지를 미리 알려줄 수 있는 기능이다. 예를 들어 TextView의 setText(int) 메서드의 경우 String 리소스 주소를 넣어야 한다는 것을 명시할 수 있다. String리소스 주소가 아닌 Drawable리소스나 임의의 Integer값을 넣는 경우 컴파일 에러를 통해 알려준다.  

<br>
### @MainThread / @UiThread / @WorkerThread
메서드가 실행될 때 해당 수행되어야 할 스레드를 명시할 수 있다. AsyncTask의 스레드에서 UI를 변경하는 작업을 하는 경우 에러가 나는데, 이런 경우를 사전에 알려준다.  

```java
@WorkerThread
void backgroundJob() {  
}

@UiThread
void uiJob() {  
}

// ...

@WorkerThread
void backgroundJob2() {  
    backgroundJob();                  // OK
    uiJob();                          // ERROR: UIThread
                                      
    view.setVisibility(View.VISIBLE); // ERROR: UIThread
                                     
}

@UiThread
void uiJob2() {  
    backgroundJob();                  // ERROR: WorkerThread
                                      
    uiJob();                          // OK
    view.setVisibility(View.VISIBLE); // OK
}

new AsyncTask<Void, Void, Void>() {  
    @Override
    protected Void doInBackground(Void... p) {
        backgroundJob();              // OK
        uiJob();                      // ERROR: UIThread
                                      
        return null;
    }

    @Override
    protected void onPostExecute(Void aVoid) {
        backgroundJob();              // ERROR: WorkerThread
                                      
                                      
        uiJob();                      // OK
    }
};
```

<br>
### @Keep
빌드시 프로가드를 통해 난독화가 되어 사용 불가능 한 클래스의 경우 난독화를 예외처리해주어야 한다. 본인이 개발하지 않는 경우 이런 히스토리를 알기는 쉽지 않다. 이런 경우 @Keep를 통해 난독화 예외처리를 해야 하는 클래스인지 명시적으로 알려줄 수 있다.  

이외에도 @CallSuper, @RequiresPermission, @Size 등 다양한 Annotation이 존재한다. 좀 더 알아보기 위해 아래 사이트를 참고하자.  

<br>
참고:
[http://tools.android.com/tech-docs/support-annotations](http://tools.android.com/tech-docs/support-annotations)
[http://michaelevans.org/blog/2015/07/14/improving-your-code-with-android-support-annotations](http://michaelevans.org/blog/2015/07/14/improving-your-code-with-android-support-annotations/)
[http://mayojava.github.io/android/android-support-annotations](http://mayojava.github.io/android/android-support-annotations)




