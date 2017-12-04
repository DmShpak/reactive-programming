const { Observable } = require('../dist/lib/observable')

describe('', () => {

    beforeEach(() => {
        jasmine.clock().install();
    });

    afterEach(function () {
        jasmine.clock().uninstall();
    });

    it('never', () => {

        const value = jasmine.createSpy()
        const error = jasmine.createSpy()
        const close = jasmine.createSpy()

        const never = Observable.never()
        const unsubscribe = never.subscribe({
            close: close,
            value: value,
            error: error
        })

        expect(error).not.toHaveBeenCalled()
        expect(value).not.toHaveBeenCalled()
        expect(close).toHaveBeenCalled()

        unsubscribe()
    })

    it('const', () => {
        const constant = Observable.constant('foo')

        const value = jasmine.createSpy()
        const error = jasmine.createSpy()
        const close = jasmine.createSpy()


        const unsubscribe = constant.subscribe({
            close: close,
            value: value,
            error: error
        })
        expect(error).not.toHaveBeenCalled()
        expect(value).toHaveBeenCalled()
        expect(close).toHaveBeenCalled()

        unsubscribe()
    })


    it('of', () => {
        const list = Observable.of(['a', 'b', 'c'])

        const value = jasmine.createSpy()
        const error = jasmine.createSpy()
        const close = jasmine.createSpy()


        const unsubscribe = list.subscribe({
            close: close,
            value: value,
            error: error
        })
        expect(error).not.toHaveBeenCalled()
        expect(value.calls.count()).toBe(3)
        expect(value.calls.argsFor(0)).toEqual(['a'])
        expect(value.calls.argsFor(1)).toEqual(['b'])
        expect(value.calls.argsFor(2)).toEqual(['c'])
        expect(close).toHaveBeenCalled()
        unsubscribe()
    })

    it('map', () => {

        const constant = Observable.constant(10)
        const mapped = constant.map(x => x * 2)
        const value = jasmine.createSpy()
        const error = jasmine.createSpy()
        const close = jasmine.createSpy()

        const unsubscribe = mapped.subscribe({ close, value, error })

        expect(error).not.toHaveBeenCalled()
        expect(value).toHaveBeenCalledWith(20)
        expect(close).toHaveBeenCalled()

        unsubscribe()
    })

    it('repeat', () => {
        const tick = Observable.repeat(1000, 'foo')

        const value = jasmine.createSpy()
        const error = jasmine.createSpy()
        const close = jasmine.createSpy()

        const unsubscribe = tick.subscribe({
            close: close,
            value: value,
            error: error
        })


        jasmine.clock().tick(1001);
        expect(value.calls.count()).toBe(1)
        expect(value.calls.argsFor(0)).toEqual(['foo'])

        jasmine.clock().tick(1000);
        expect(value.calls.count()).toBe(2)
        expect(value.calls.argsFor(1)).toEqual(['foo'])

        jasmine.clock().tick(1000);
        expect(value.calls.count()).toBe(3)
        expect(value.calls.argsFor(2)).toEqual(['foo'])

        jasmine.clock().tick(1000);
        expect(value.calls.count()).toBe(4)
        expect(value.calls.argsFor(3)).toEqual(['foo'])

        jasmine.clock().tick(1000);
        expect(value.calls.count()).toBe(5)
        expect(value.calls.argsFor(4)).toEqual(['foo'])

        expect(error).not.toHaveBeenCalled()
        expect(close).not.toHaveBeenCalled()

        unsubscribe()
    })

})