class: center, middle

# Reactive Programming

Learn by byke writing
---

# Regular call

- **Action source** know about **Action place**
 
---

## Action source

```typescript

class Caller {
    private target: Target;
    constructor(target: Target) {
        this.target = target
    }
    someThingHappen() {
        this.target.someReaction()
    }
    destroy() {
        this.target.destroy()
    }
}
```

---

##Action place 

```typescript
class Target {
    constructor() {

    }
    someReaction() {
        console.log('baz')
    }
    destroy() {

    }
}
```

---

##All together

```typescript

const caller = new Caller(new Target)

caller.someThingHappen()
setTimeout(() => {
    caller.destroy()
}, 5000)

```
---
#Callback

- **Action place** know about **action source**

---

## Action source

```typescript
type Callback<P> = { (props: P): void }
        
class Caller<P> {
    private callbacks: Callback<P>[]
        
    constructor() {
        this.callbacks = []
    }
        
    someThingHappen(props: P) {
        this.callbacks.forEach(cb => cb(props))
    }
        
    registerCallback(cb: Callback<P>) {
        this.callbacks.push(cb)
    }
        
    unregisterCallback(cb: Callback<P>) {
        this.callbacks.splice(this.callbacks.indexOf(cb), 1)
    }
}
        
```

---

## Action place

```typescript
class Target {
    caller: Caller<string>;

    constructor(caller: Caller<string>) {
        //register some resource
        this.caller = caller
        this.caller.registerCallback(this.someReaction)
    }

    someReaction(props: string) {
        console.log(props)
    }

    destroy() {
        //free resources
        this.caller.unregisterCallback(this.someReaction)
    }
}
```
---
## All together

```typescript
const caller = new Caller<string>()
const target = new Target(caller)
        
caller.someThingHappen('baz')
target.destroy()        
```

---

# Event emitter
- Register callbacks by name

---
## Event emitter base class

```typescript

type Callback<P> = { (props: P): void }
        
type CallbacksMap<T> = {
    [EventName in keyof T]?: Callback<T[EventName]>[]
}

```
---
```typescript

class EventEmitter<T> {
        
    private callbacksMap: CallbacksMap<T> = {} as CallbacksMap<T>
        
    emit<E extends keyof T>(eventName: E, props?: T[E]) {
        const callbacks = this.callbacksMap[eventName]
        callbacks && callbacks.forEach(cb => cb(props))
    }
        
    addEventListener<E extends keyof T>(eventName: E, cb: Callback<T[E]>) {
        const callbacks = this.callbacksMap[eventName]
        if (callbacks) {
            callbacks.push(cb)
        }
        else {
            this.callbacksMap[eventName] = [cb]
        }
    }
        
```
---
```typescript

    removeEventListener<E extends keyof T>(eventName: E, cb: Callback<T[E]>) {
        const callbacks = this.callbacksMap[eventName]
        if (callbacks) {
            const index = callbacks.indexOf(cb)
            if (index >= -1) {
                callbacks.splice(index, 1)
            }
            else {
                throw new Error()
            }
        
            if (!callbacks.length) {
                delete this.callbacksMap[eventName]
            }
        }
        else {
            throw new Error()
        }
    }
        
        
    removeAllEventListeners() {
        this.callbacksMap = {} as CallbacksMap<T>
    }
        
}
        
```
---
## Action source
```typescript
class Caller extends EventEmitter<{ 'something-happen': void }> {
    someThingHappen() {
        this.emit('something-happen')
    }
}
```
---
## Action place
```typescript
class Target {
    caller: Caller;
    constructor(caller: Caller) {
        this.caller = caller
        this.caller.addEventListener('something-happen', this.someReaction)
    }
    someReaction() {
        console.log('baz')
    }
    destroy() {
        this.caller.removeEventListener('something-happen', this.someReaction)
    }
}
```
---
## All together

```typescript
const caller = new Caller;
const target = new Target(caller)

caller.someThingHappen()
target.destroy()
```
---
# Event observer

- Free resources without bolerplate
---
## Event observer base class

```typescript

type Destroyer = { (): void }

class EventObserver {

    private destroyers: Destroyer[] = []

    listenTo<E, N extends keyof E, P extends E[N]>(target: EventEmitter<E>, eventName: N, cb: Callback<P>) {
        target.addEventListener(eventName, cb)
        const destroyer = () => target.removeEventListener(eventName, cb)
        this.destroyers.push(destroyer)
        return destroyer
    }

    destroy() {
        this.destroyers.forEach(d => d())
    }
}
```
---
## Our classes - only clear code

```typescript

class Caller extends EventEmitter<{ 'something-happen': void }> {
    someThingHappen() {
        this.emit('something-happen')
    }
}

class Target extends EventObserver {
    constructor(caller: Caller) {
        super()
        this.listenTo(caller, 'something-happen', this.someReaction)
    }
    someReaction() {
        console.log('baz')
    }
}

```
---
## All together

```typescript
const caller = new Caller;
const target = new Target(caller)

caller.someThingHappen()
target.destroy()
```
---

# Activatable
- Do something only if somebody listen
- Free resources if nobody listen

---

```typescript
import { EventEmitter, Callback } from '../lib/event-emitter'

type Destroyer = {
    (): void
}

type HandlerProps<T> = {
    value: Callback<T>
}
```
---
```typescript
abstract class Activatable<T> {
        
    private subscriptionsCount = 0
    private destroyer: Destroyer;
    protected ee = new EventEmitter<{ value: T }>()
        
    protected abstract handler(props: HandlerProps<T>): Destroyer;
        
    subscribe(cb: Callback<T>) {
        this.addEventListener(cb)
        return () => this.removeEventListener(cb)
    }
        
    private addEventListener(cb: Callback<T>) {
        this.ee.addEventListener('value', cb)
        this.subscriptionsCount++
        if (this.subscriptionsCount === 1) {
            this.destroyer = this.handler({
                value: (props: T) => this.ee.emit('value', props)
            })
        }
    }
        
    private removeEventListener(cb: Callback<T>) {
        this.ee.removeEventListener('value', cb)
        this.subscriptionsCount--;
        if (this.subscriptionsCount === 0) {
            this.destroyer()
        }
    }
}
```
---
## Use it

```typescript
class Tick extends Activatable<number> {
    protected handler(props:HandlerProps<number>) {
    const id = setInterval(() => props.value(Date.now()))
        return () => clearInterval(id)
    }
}
    
const wait = (ms:number) => new Promise(resolve => setTimeout(resolve, ms))
    
const _do = async () => {
    const tick = new Tick
    await wait (1000)
    const unsubscribe = tick.subscribe(value => console.log (value))
    await wait (5000)
    unsubscribe()
    wait (5000)
}
     
_do();
    
```
---

# Observable object
- Is **Activatable** object - do nothing without subscribtion
- Emit events **value**,  **end**, and **error**

---

## Define types
```typescript
import { EventEmitter, Callback } from '../lib/event-emitter'


export type Destroyer = {
    (): void
}

type EventTypes<V, E> = {
    value: V
    error: E
    close: void
}

export type HandlerProps<V, E> = {
    value: Callback<V>
    error: Callback<E>
    close: Callback<void>
}
```

---
```typescript
export abstract class ObservableClass<V, E> {
        
    protected subscriptionCount = 0;
        
    private destroyer: Destroyer = null;
        
    private ee = new EventEmitter<EventTypes<V, E>>()
        
    protected abstract handler(props: HandlerProps<V, E>): Destroyer;
            
    subscribe(props: HandlerProps<V, E>): Destroyer {
        this.addEventListeners(props)
        return () => this.removeEventListeners(props)
    }
        
```
---
```typescript
    private addEventListeners(props: HandlerProps<V, E>) {
        this.ee.addEventListener('value', props.value)
        this.ee.addEventListener('error', props.error)
        this.ee.addEventListener('close', props.close)
        
        this.subscriptionCount++
        
        if (this.subscriptionCount === 1) {
            try {
                this.destroyer = this.handler({
                    value: v => {
                        this.ee.emit('value', v)
                    },
                    error: e => {
                        this.ee.emit('error', e)
                        this.ee.removeAllEventListeners()
                        this.subscriptionCount = 0
                    },
                    close: () => {
                        this.ee.emit('close')
                        this.ee.removeAllEventListeners()
                        this.subscriptionCount = 0
                    }
                })
            } catch (e) {
                this.ee.emit('error', e)
                this.ee.removeAllEventListeners()
                this.subscriptionCount = 0        
            }
        }
    }
```            
---
```typescript
    private removeEventListeners(props: HandlerProps<V, E>) {
        if (this.subscriptionCount) {
            this.ee.removeEventListener('value', props.value)
            this.ee.removeEventListener('error', props.error)
            this.ee.removeEventListener('close', props.close)
            this.subscriptionCount--
            if (this.subscriptionCount === 0) {
                this.destroyer()
            }
        }
    }
}
```
---
# Create toolset
- Create observable from other data types
- Create change observable by methods
---
```typescript
import { ObservableClass, HandlerProps } from '../lib/observable-class'

export abstract class Observable<T, E extends Error> extends ObservableClass<T, E> {

    static never() {
        return new Never
    }

    static constant<T>(v: T) {
        return new Constant(v)
    }

    static of<T>(v: T[]) {
        return new List<T>(v)
    }

    static repeat<T>(timeMs: number, value: T = null) {
        return new Repeat<T>(timeMs, value)
    }

    map<V>(cb: MapFunction<T, V>) {
        return new MapValue(this, cb)
    }
}
```
---
```typescript
export type MapFunction<T, V> = {
    (x: T): V
}

export class MapValue<T, V, E extends Error> extends Observable<V, E> {
    private mapFunction: MapFunction<T, V> = null
    private target: ObservableClass<T, E>
    constructor(target: ObservableClass<T, E>, mapFunction: MapFunction<T, V>) {
        super()
        this.target = target
        this.mapFunction = mapFunction
    }
    handler({ close, error, value }: HandlerProps<V, E>) {
        return this.target.subscribe({
            close,
            error,
            value: x => {
                try {
                    return value(this.mapFunction(x))
                } catch (e) {
                    return error(e)
                }
            }
        })
    }
}
```
---
```typescript
export class Constant<T> extends Observable<T, never> {
    private _val: T
    constructor(value: T) {
        super()
        this._val = value

    }
    handler(props: HandlerProps<T, void>) {
        props.value(this._val)
        props.close(null)
        return () => { }
    }
}

```
---
```typescript

export class Never extends Observable<never, never> {
    handler(props: HandlerProps<void, void>) {
        props.close(null)
        return () => { }
    }
}
```
---
```typescript

export class List<T> extends Observable<T, never> {
    private _list: T[];
    constructor(list: T[]) {
        super()
        this._list = list
    }
    handler(props: HandlerProps<T, void>) {
        this._list.forEach(item => props.value(item))
        props.close(null)
        return () => { }
    }
}
```
---
```typescript

export class Repeat<T> extends Observable<T, never> {

    private _Id: any
    private _valie: T
    private _timeMs: number

    constructor(timeMs: number, value: T = null) {
        super()
        this._timeMs = timeMs
        this._valie = value
    }

    handler(props: HandlerProps<T, void>) {
        this._Id = setInterval(() => {
            props.value(this._valie)
        }, this._timeMs)
        return () => {
            clearInterval(this._Id)
        }
    }
}
```
---
#Reactive Programming Libraries
- RxJs 
- [Bacon.js](https://baconjs.github.io/)
- [https://github.com/kefirjs/kefir](Kefir.js) 
- [https://xgrommx.github.io/rx-book/content/resources/reactive_libraries/index.html](etc...)   

---
## RxJs
- Created by Microsoft
- VERY big comunity
- Long list of supported languages
- Sometimes slow
- A lot of tools in toolbox

---
## Bacon.js
- Oldest on js
- slow
- oldschool classics

---
## Kefir.js
- Fast and compact
- Small comunity
- No good typescript typings
