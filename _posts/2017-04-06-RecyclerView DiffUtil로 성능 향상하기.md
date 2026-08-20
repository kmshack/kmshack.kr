---
title: RecyclerView DiffUtil로 목록 업데이트 최적화하기
tags: 안드로이드
layout: post
last_modified_at: 2017-04-06
legacy: true
---

목록 전체를 다시 그리는 `notifyDataSetChanged()`는 변경 범위가 작을 때 불필요한 작업을 만든다. `DiffUtil`을 사용하면 이전 목록과 새 목록의 차이를 계산해 필요한 항목만 갱신할 수 있다. RecyclerView의 목록 업데이트를 효율적으로 처리하는 방법을 살펴본다.  

<br>
## DiffUtil?

RecyclerView Support Library v7의 24.2.0버전에 DiffUtil이라는 매우 편리한 유틸리티 클래스가 포함되었습니다. 이 클래스는 두 목록간의 차이점을 찾고 업데이트 되어야 할 목록을 반환해줍니다. RecyclerView 어댑터에 대한 업데이트를 알리는데 사용됩니다.  

Eugene W. Myers’s의 차이 알고리즘을 이용하여 최소한의 업데이트 수를 계산합니다.

<br>
## 어떻게 사용하나?

DiffUtil.콜백은 추상 클래스이며 두 목록 간의 차이를 계산하는 동안 DiffUtil에 의해 콜백 클래스로 사용됩니다. 4개의 추상 메서드와 1개의 비추상 메서드로 이루어져있습니다. 이를 확장하고 모든 메서드를 오버라이드해야 합니다.

- getOldListSize(): 이전 목록의 개수를 반환합니다.  
- getNewListSize(): 새로운 목록의 개수를 반환합니다.  
- areItemsTheSame(int oldItemPosition, int newItemPosition): 두 객체가 같은 항목인지 여부를 결정합니다.  
- areContentsTheSame(int oldItemPosition, int newItemPosition): 두 항목의 데이터가 같은지 여부를 결정합니다. `areItemsTheSame()`이 true를 반환하는 경우에만 호출됩니다.  
- getChangePayload(int oldItemPosition, int newItemPosition): 만약 `areItemTheSame()`이 true를 반환하고 `areContentsTheSame()`이 false를 반환하면 이 메서드가 호출되어 변경 내용에 대한 페이로드를 가져옵니다.  

<br>
다음은 `EmployeeRecyclerViewAdapter` 및 `EmployeeDiff콜백`에서 직원 목록을 정렬하는데 사용하는 간단한 `Employee`클래스입니다.

```java
public class Employee {
    public int id;
    public String name;
    public String role;
}
```

다음은 `Diff.콜백` 클래스의 구현입니다. `getChangePayload()`가 추상 메서드가 아님을 알 수 있습니다.

<br>

```java
public class EmployeeDiffCallback extends DiffUtil.Callback {
    private final List<Employee> mOldEmployeeList;
    private final List<Employee> mNewEmployeeList;

    public EmployeeDiffCallback(List<Employee> oldEmployeeList, List<Employee> newEmployeeList) {
        this.mOldEmployeeList = oldEmployeeList;
        this.mNewEmployeeList = newEmployeeList;
    }

    @Override
    public int getOldListSize() {
        return mOldEmployeeList.size();
    }

    @Override
    public int getNewListSize() {
        return mNewEmployeeList.size();
    }

    @Override
    public boolean areItemsTheSame(int oldItemPosition, int newItemPosition) {
        return mOldEmployeeList.get(oldItemPosition).getId() == mNewEmployeeList.get(
                newItemPosition).getId();
    }

    @Override
    public boolean areContentsTheSame(int oldItemPosition, int newItemPosition) {
        final Employee oldEmployee = mOldEmployeeList.get(oldItemPosition);
        final Employee newEmployee = mNewEmployeeList.get(newItemPosition);

        return oldEmployee.getName().equals(newEmployee.getName());
    }

    @Nullable
    @Override
    public Object getChangePayload(int oldItemPosition, int newItemPosition) {
        // Implement method if you're going to use ItemAnimator
        return super.getChangePayload(oldItemPosition, newItemPosition);
    }
}
```

DiffUtil.콜백 구현이 완료되면 아래 설명 된대로 RecyclerViewAdapter의 목록 변경사항을 업데이트 해야합니다.

<br>

```java
public class CustomRecyclerViewAdapter extends RecyclerView.Adapter<CustomRecyclerViewAdapter.ViewHolder> {
  ...
       public void updateEmployeeListItems(List<Employee> employees) {
        final EmployeeDiffCallback diffCallback = new EmployeeDiffCallback(this.mEmployees, employees);
        final DiffUtil.DiffResult diffResult = DiffUtil.calculateDiff(diffCallback);

        this.mEmployees.clear();
        this.mEmployees.addAll(employees);
        diffResult.dispatchUpdatesTo(this);
    }
}
```
DiffUtil.dispactUpdatesTo(RecyclerView.Adapter adapter)를 호출 하여 업데이트할 Adapter를 전달하세요. diff계산에서 반환된 DiffResult 객체가 변경사항을 Adapter에 전달하고 어댑터가 변경 사항에 대해 알림을 받습니다.  

getChangePayload()에서 반환 된 객체는 notifyItemRangeChanged(position, count, payload)를 DiffResult에서 호출하여 결론적으로 onBindViewHolder(… List<Object> payloads) 메서드가 호출되어 목록이 업데이트 됩니다. 이때 업데이트될 목록은 정말 업데이트가 필요한 아이템만 호출된다는 점입니다.

```java
@Override
public void onBindViewHolder(ProductViewHolder holder, int position, List<Object> payloads) {
  // Handle the payload
}
```

<br>
DiffUtil은 RecyclerView.Adapter의 다양한 데이터 업데이트 메서드를 사용하여 알립니다.  

- notifyItemMoved()
- notifyItemRangeChanged()
- notifyItemRangeInserted()
- notifyItemRangeRemoved()
- RecyclerView.Adapter 및 해당 메서드에 대한 자세한 내용은 여기에서 읽을 수 있습니다.

<br>
## 중요

목록이 많으면 작업에 상당한 시간이 걸릴 수 있으므로 백그라운드 스레드에서 실행하고 DiffUtil.DiffResult를 가져와서 메인 스레드(UI 스레드)의 RecyclerView에 적용하세요. 또한 구현 제약으로 목록의 최대 크기는 2²⁶개로 제한되어 있습니다.  

<br>
## 성능

DiffUtil은 두 목록 간의 추가 및 제거 작업의 최소 수를 찾기 위해 O(N) 공간이 필요합니다. 예상되는 성능은 O(N + D²)입니다.  
- N: 추가 및 제거 된 항목의 총 수  
- D: 스크립트 길이  

<br>
더 많은 성능 수치를 보려면 [Android의 공식 페이지](https://developer.android.com/reference/android/support/v7/util/DiffUtil.html)를 살펴볼 수 있습니다. 위의 DiffUtil 예제의 참조 구현을 [GitHub](https://github.com/AnkitSinhal/DiffUtilExample)에서 찾을 수 있습니다.
