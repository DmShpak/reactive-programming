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


export class Never extends Observable<never, never> {
    handler(props: HandlerProps<void, void>) {
        props.close(null)
        return () => { }
    }
}

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