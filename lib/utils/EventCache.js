const { debounce } = require('throttle-debounce');

const NUMBER_OF_CHUNKS = 100;

class EventCache {
    constructor({ handler, debounceTime = 100, cacheSize = 10000 } = {}) {  // eslint-disable-line  no-magic-numbers
        this.events         = [];
        this.reservedEvents = [];
        this.handler        = handler;
        this.cacheSize      = cacheSize;
        this.length         = 0;

        this.processDebounced = debounce(debounceTime, this.process);
    }

    isOverflowed = () => {
        return (this.reservedEvents.length >= NUMBER_OF_CHUNKS && this.reservedEvents[0]?.length >= this.cacheSize);
    }

    addNewBatchToReservedPool = () => {
        this.reservedEvents.unshift([]);
    }

    addReservedEvent = (event) => {
        const idx = 0;

        if (!this.reservedEvents[idx]) {
            this.addNewBatchToReservedPool();
        }

        if (this.reservedEvents[0]?.length >= this.cacheSize) this.addNewBatchToReservedPool();

        this.reservedEvents[idx].push(event);
    }


    push = (event, withoutProcessing = false) => {
        if (this.length < this.cacheSize) {
            this.events.push(event);
            this.length++;

            if (!withoutProcessing) {
                this.processDebounced();
            }

            return;
        }

        // remove oldest batch from storage
        if (this.isOverflowed()) this.reservedEvents.pop();

        this.addReservedEvent(event);
    }

    process = () => {
        const res = this.reduce();

        this.handler(res);
    }

    reduce = (obj) => {
        const res = obj || {};
        let event;

        while (event = this.events.shift()) {   // eslint-disable-line no-cond-assign
            const { topic, msg } = event.data;

            switch (event.type) {
                case 'ADD_EVENT':
                    res[topic] = msg;
                    break;
                default:
                    break;
            }
        }

        if (this.reservedEvents.length) {
            const firstChunk = this.reservedEvents.pop();

            this.events = [ ...firstChunk ];
            this.length = firstChunk.length;

            return this.reduce(res);
        }
        this.length = 0;

        return res;
    }
}

module.exports = EventCache;
