
//so move callback creation to base class
export type Callback<P> = { (props: P): void }

type CallbacksMap<T> = {
    [EventName in keyof T]?: Callback<T[EventName]>[]
}

export class EventEmitter<T> {

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