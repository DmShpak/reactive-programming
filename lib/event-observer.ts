import { EventEmitter, Callback } from './event-emitter'

type Destroyer = { (): void }

export class EventObserver {

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