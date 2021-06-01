"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitEvents = exports.ScCallEvent = exports.UnfreezeEvent = exports.TransferEvent = void 0;
class TransferEvent {
    constructor(action_id, to, value) {
        this.action_id = action_id;
        this.to = to;
        this.value = value;
    }
}
exports.TransferEvent = TransferEvent;
class UnfreezeEvent {
    constructor(action_id, to, value) {
        this.id = action_id;
        this.to = to;
        this.value = value;
    }
}
exports.UnfreezeEvent = UnfreezeEvent;
class ScCallEvent {
    constructor(action_id, to, value, endpoint, args) {
        this.action_id = action_id;
        this.to = to;
        this.value = value;
        this.endpoint = endpoint;
        this.args = args;
    }
}
exports.ScCallEvent = ScCallEvent;
async function emitEvents(emitter, listener) {
    emitter.eventIter(async (event) => {
        if (event == undefined) {
            return;
        }
        const ev = await emitter.eventHandler(event);
        ev !== undefined && await listener.emittedEventHandler(ev);
    });
}
exports.emitEvents = emitEvents;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhaW5faGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jaGFpbl9oYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLE1BQWEsYUFBYTtJQUt0QixZQUFZLFNBQW9CLEVBQUUsRUFBVSxFQUFFLEtBQWdCO1FBQzFELElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQzNCLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ2IsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDdkIsQ0FBQztDQUNKO0FBVkQsc0NBVUM7QUFFRCxNQUFhLGFBQWE7SUFLdEIsWUFBWSxTQUFvQixFQUFFLEVBQVUsRUFBRSxLQUFnQjtRQUMxRCxJQUFJLENBQUMsRUFBRSxHQUFHLFNBQVMsQ0FBQztRQUNwQixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNiLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ3ZCLENBQUM7Q0FDSjtBQVZELHNDQVVDO0FBRUQsTUFBYSxXQUFXO0lBT3BCLFlBQVksU0FBb0IsRUFBRSxFQUFVLEVBQUUsS0FBZ0IsRUFBRSxRQUFnQixFQUFFLElBQWU7UUFDN0YsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFDM0IsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDYixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUN6QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztJQUNyQixDQUFDO0NBQ0o7QUFkRCxrQ0FjQztBQU9NLEtBQUssVUFBVSxVQUFVLENBQXdCLE9BQTRDLEVBQUUsUUFBaUM7SUFDbkksT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUU7UUFDOUIsSUFBSSxLQUFLLElBQUksU0FBUyxFQUFFO1lBQ3BCLE9BQU87U0FDVjtRQUNELE1BQU0sRUFBRSxHQUFHLE1BQU0sT0FBTyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM3QyxFQUFFLEtBQUssU0FBUyxJQUFJLE1BQU0sUUFBUSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQy9ELENBQUMsQ0FBQyxDQUFBO0FBQ04sQ0FBQztBQVJELGdDQVFDIn0=