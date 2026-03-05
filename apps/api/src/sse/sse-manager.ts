import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

interface SseEvent {
  type: string;
  data: Record<string, unknown>;
}

@Injectable()
export class SseManager {
  private subjects = new Map<string, Subject<SseEvent>>();
  private subscriberCount = new Map<string, number>();

  emit(key: string, event: SseEvent): void {
    const subject = this.subjects.get(key);
    if (subject) {
      subject.next(event);
    }
  }

  subscribe(key: string): Observable<MessageEvent> {
    if (!this.subjects.has(key)) {
      this.subjects.set(key, new Subject<SseEvent>());
      this.subscriberCount.set(key, 0);
    }
    const subject = this.subjects.get(key)!;
    this.subscriberCount.set(key, (this.subscriberCount.get(key) ?? 0) + 1);

    return subject.asObservable().pipe(
      map(
        (event) =>
          ({
            data: JSON.stringify(event),
            type: event.type,
          }) as MessageEvent,
      ),
      finalize(() => {
        const count = (this.subscriberCount.get(key) ?? 1) - 1;
        if (count <= 0) {
          this.subjects.get(key)?.complete();
          this.subjects.delete(key);
          this.subscriberCount.delete(key);
        } else {
          this.subscriberCount.set(key, count);
        }
      }),
    );
  }

  complete(key: string): void {
    const subject = this.subjects.get(key);
    if (subject) {
      subject.complete();
      this.subjects.delete(key);
      this.subscriberCount.delete(key);
    }
  }
}
