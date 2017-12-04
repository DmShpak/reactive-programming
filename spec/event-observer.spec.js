const { EventEmitter } = require('../dist/lib/event-emitter')
const { EventObserver } = require('../dist/lib/event-observer')

describe('', () => {

    it('', () => {
        const ee = new EventEmitter
        const eo = new EventObserver
        const spy = jasmine.createSpy()
        eo.listenTo(ee, 'test', spy)
        ee.emit('test')
        expect(spy).toHaveBeenCalled()
        eo.destroy()
        spy.calls.reset()
        ee.emit('test')
        expect(spy).not.toHaveBeenCalled()
    })

})