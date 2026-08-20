---
title: ConstraintLayout으로 전환 애니메이션 만들기
tags: 안드로이드
layout: post
legacy: true
---

ConstraintLayout은 복잡한 뷰 계층을 줄이는 데 유용할 뿐 아니라, 서로 다른 Constraint 집합 사이를 전환하는 애니메이션에도 활용할 수 있다. `ConstraintSet`과 `TransitionManager`를 조합해 적은 코드로 레이아웃 변화를 애니메이션으로 표현하는 방법을 살펴본다.  
<br>

|:---------------:|
|<br> ![](/blog/images/2017-06-30-constraintlayout/1.gif){:.center-image} <br>|


<br>
## 방법
ConstraintLayout의 기본 사항을 알고 있다고 가정합니다 (예: `app:layout_constraintLeft_toLeftOf` 및 다른 속성). 대부분의 문서 또는 사이트에서는 새로 개선 된 Android Studio 레이아웃 디자인 패널을 사용하여 다양한 Constraint를 드래그/드롭/시각화 하는 방법만 소개되어 있습니다. 애니메이션의 목적을 위해서는 Constraint를 정확하게 이해하고 있어야만 조작이 가능합니다.  

가장 간단한 형식인 TransitionManager(API 19 이상 또는 서포트 라이브러리에서 사용 가능)를 통해 두 가지 Constraint 집합 간에 애니메이션을 적용할 수 있습니다. 긴 설명 보다 간단한 예제를 살펴 보겠습니다.

<br>
## 예제
Activity 실행시 초기화되는 XML 레이아웃부터 살펴 보겠습니다.

```xml
<android.support.constraint.ConstraintLayout ...>

    <ImageView
        android:id="@+id/image"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        app:layout_constraintLeft_toLeftOf="parent"
        app:layout_constraintRight_toRightOf="parent"
        ... />

    <Button ... />

</android.support.constraint.ConstraintLayout>
```
이것은 화면의 너비와 일치하는 화면 상단에 ImageView를 정의하는 기본 XML 파일입니다. (ConstraintLayout은 match_parent를 지원하지 않습니다.) 이제 하나의 추가 Constraint를 가진 대체 XML 레이아웃을 정의합시다.

```xml
<android.support.constraint.ConstraintLayout ...>

    <ImageView
        android:id="@+id/image"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        app:layout_constraintLeft_toLeftOf="parent"
        app:layout_constraintRight_toRightOf="parent"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toBottomOf="parent"
        ... />

    <Button ... />

</android.support.constraint.ConstraintLayout>
```

여기서 유일한 차이점은 새 XML 레이아웃이 부모의 높이와 일치하는 높이로 설정하는것 입니다. 결과적으로 ImageView는 수직으로 가운데 정렬됩니다.  

이제 두 개의 서로 다른 제약 조건 세트 (하나는 ImageView를 수직으로 중심에 배치하지 않고, 하나는 수직으로 가운데 배치)간에 애니메이션을 적용하려면 다음 코드를 Activity에 추가해야합니다.
(참고: 여기서는 Kotlin에 쓰여 있습니다. Kotlin에 익숙하지 않은 분은 Java 코드와 완전히 역 호환되는 동시에 최신 프로그래밍 언어의 많은 이점을 제공하므로 지금 시작하는 것이 좋습니다. [이제 Android에서 공식적으로 지원되는 언어입니다!](https://developer.android.com/kotlin/index.html))

```java
override fun onCreate(savedInstanceState: Bundle?) {
    ...
    val constraintSet1 = ConstraintSet()
    constraintSet1.clone(constraintLayout)
    val constraintSet2 = ConstraintSet()
    constraintSet2.clone(this, R.layout.activity_main_alt)

    var changed = false
    findViewById(R.id.button).setOnClickListener {
        TransitionManager.beginDelayedTransition(constraintLayout)
        val constraint = if (changed) constraintSet1 else constraintSet2
        constraint.applyTo(constraintLayout)
        changed = !changed
    }
}
```

constraintSet1과 constraintSet2는 비 수직 가운데 정렬과 수직 가운데 정렬에 대응하도록 설정합니다. 먼저 TransitionManager에 ConstraintLayout에서 지연된 전환을 시작하라고 지시합니다. 그런 다음 ConstraintLayout에 다른 Constraint 집합을 적용합니다. TransitionManager는 자동으로 애니메이션을 수행하여 Constraint의 변경 사항을 표시합니다.


<br>
### 실제로 XML 레이아웃을 복제하나요?  

무엇을 생각하는지 알고 있습니다. 이 접근법은 Constraint 변경을 위해 레이아웃 파일을 복제해야합니다. 아무도 중복 된 코드를 좋아하지 않습니다.  
이것은 실제로 생각만큼 나쁘지 않습니다.  

전환을 위해 대체 XML파일 생성하는 경우 레이아웃의 모든 속성(예 : `textSize`)을 생략 할 수 있습니다. ConstraintSet은 각 뷰의 Constraint의 속성을 제외한 나머지 속성을 무시합니다. 이렇게하면 두 파일에서 일관된 스타일을 유지할 필요가 없습니다.(예: 원래 XML에서 `textSize`를 변경하면 대체 XML에서 이를 변경할 필요는 없습니다.)
XML 코드 복제를 하고 싶지 않는 경우, 코드에서 동적으로 속성을 변경하면 됩니다.  

위의 예를 하나의 레이아웃 XML로 어떻게 변경하는지 살펴 보겠습니다.

```java
override fun onCreate(savedInstanceState: Bundle?) {
    ...
    val constraintSet1 = ConstraintSet()
    constraintSet1.clone(constraintLayout)
    val constraintSet2 = ConstraintSet()
    constraintSet2.clone(constraintLayout)
    constraintSet2.centerVertically(R.id.image, 0)

    var changed = false
    findViewById(R.id.button).setOnClickListener {
        TransitionManager.beginDelayedTransition(constraintLayout)
        val constraint = if (changed) constraintSet1 else constraintSet2
        constraint.applyTo(constraintLayout)
        changed = !changed
    }
}
```
위의 코드에서 constraintSet2에 속성을 코드에서 변경하여 애니메이션을 수행하고 있습니다. 이렇게하면 우리는 Constraint 속성을 그대로 유지하고 코드 복제를 피할 수 있습니다.  

<br>
>**하지만 이미 Transition 프레임워크를 사용하여 동일하게 사용할 수 있다!**  

<br>

이것은 전혀 새로운 방식이 아닙니다. Transition 프레임워크 또는 animateLayoutChanges와 같은 속성을 사용하여 동일한 작업을 수행할 수 있습니다. 그러나 Constraint를 지정할 수 있기 때문에 훨씬 강력합니다. 또 다른 이 점은 많은 요소를 애니메이션으로 만들려고 할 때입니다. 이 애니메이션을 살펴 보겠습니다.  

[Robinhood](https://robinhood.com)가 ConstraintLayout을 사용하여 주문 애니메이션을 만듭니다. Robinhood (Android)의 주문 흐름 애니메이션입니다. 페이지의 모든 단일 요소(카드, 사용자 정의 키패드, FAB 등)를 수동으로 애니메이팅 하도록 구현되어 있습니다. 이 코드는 특히 앞뒤 애니메이션을 따로 작업한다는 점을 감안할 때 읽기에 약간의 문제가 있습니다.  

대신이 애니메이션에 ConstraintLayout을 사용하는 샘플 앱을 만들었습니다. 이 구현은 훨씬 간단합니다. 변경되어야 할 속성만 바꾼다음 대체 XML 레이아웃 파일을 지정하면 애니메이션 프레임워크가 모든 것을 애니메이션으로 변환합니다. UI에서 이 애니메이션을 처리하는 코드는 ~250라인에서 ~30라인으로 간단해졌습니다.

<br>
## 추가 팁!

ConstraintLayout 애니메이션을 시작하는 데 사용하는 코드를 기억하십니까?

```java
TransitionManager.beginDelayedTransition(constraintLayout)
```

두 번째 매개변수로 애니메이션을 커스터마이징할 수 있다. 기본값은 내부에 구현된 Transition이며, 필요하면 애니메이션 속도 등을 변경할 수 있다.

```java
val transition = AutoTransition()
transition.duration = 1000
TransitionManager.beginDelayedTransition(
        constraintLayout, transition)
```

<br>
## 사소한주의 사항
ConstraintLayout 애니메이션으로 사용해 본 후, 나는 애니메이션을 구현할 때 고려해야 할 몇 가지주의 사항을 발견했습니다.


1. ConstraintLayout은 핸들링하는 자식에 대한 속성변경을 알고 있기 때문에 직접 자식에 대해서만 애니메이션을 수행합니다. 이는 중첩된 ViewGroups인 경우 잘 처리 되지 않음을 의미합니다. 위의 예제에서 CardView 내부의 텍스트는 외부 ConstraintLayout에 의해 처리되지 않으므로 코드에서 수동으로 애니메이션을 적용해야합니다. 이것은 아마도 중첩된 ConstraintLayout을 사용하여 해결할 수 있지만 여기서는 사용하지 않았습니다.
2. ConstraintLayout은 레이아웃 관련 변경 사항 만 애니메이션으로 나타냅니다. 대체 XML에서 다른 속성(예: `elevation`, `text`)을 읽을 수 없으며 프레임워크가 모든 것을 처리 합니다. `ConstraintSet.clone()`은 레이아웃/Constraint 변경 사항을 복사하고 다른 모든 항목은 삭제합니다.

3. constraint-layout:1.0.2에서 ConstraintLayout 속성을 동적으로 변경하면 업데이트 된 속성을 고려하지 않고 애니메이션됩니다.(예: `translationY`). 즉, 애니메이션을 실행하면 변경전의 속성의 값으로 되돌아 간뒤 새로운 값으로 애니메이션이 적용됩니다.  

<br>
## 마치며

ConstraintLayout을 사용하는 페이지에서 애니메이션을 구현할 함으로 Transition 프레임 워크 보다 많은 기본 레이아웃 변경 애니메이션을 수행할 수 있습니다. 이를 통해 Activity/Fragment에서 UI/애니메이션 로직을 압축하고 XML로 통합 할 수 있습니다. 또한 더 읽기 쉬운 애니메이션 구조를 만듭니다.  


**아무도 코드로 작성된 방식의 애니메이션을 읽는 것을 좋아하지 않습니다.**
