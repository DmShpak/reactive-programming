//const jasmine = require ('jasmine')
const { EventEmitter } = require('../dist/lib/event-emitter')


describe('event emitter', () => {
    it('event observer', () => {

        const ee = new EventEmitter
        const spy = jasmine.createSpy()

        ee.addEventListener('test', spy)
        ee.emit('test')
        expect(spy).toHaveBeenCalled();

        spy.calls.reset()
        ee.removeEventListener('test', spy)
        ee.emit('test')
        expect(spy).not.toHaveBeenCalled();

    })
})