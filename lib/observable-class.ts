import { EventEmitter, Callback } from './event-emitter'

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


export abstract class ObservableClass<V, E> {

    protected subscriptionCount = 0;

    private destroyer: Destroyer = null;

    private ee = new EventEmitter<EventTypes<V, E>>()

    protected abstract handler(props: HandlerProps<V, E>): Destroyer;


    subscribe(props: HandlerProps<V, E>): Destroyer {
        this.addEventListeners(props)
        return () => this.removeEventListeners(props)
    }

    private addEventListeners(props: HandlerProps<V, E>) {

        this.ee.addEventListener('value', props.value)
        this.ee.addEventListener('error', props.error)
        this.ee.addEventListener('close', props.close)

        this.subscriptionCount++

        if (this.subscriptionCount === 1) {
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
        }
    }

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


