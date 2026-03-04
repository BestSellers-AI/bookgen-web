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

  emit(key: string, event: SseEvent): void {
    const subject = this.subjects.get(key);
    if (subject) {
      subject.next(event);
    }
  }

  subscribe(key: string): Observable<MessageEvent> {
    if (!this.subjects.has(key)) {
      this.subjects.set(key, new Subject<SseEvent>());
    }
    const subject = this.subjects.get(key)!;

    return subject.asObservable().pipe(
      map(
        (event) =>
          ({
            data: JSON.stringify(event),
            type: event.type,
          }) as MessageEvent,
      ),
      finalize(() => {
        // Clean up if no more subscribers
        // (Subject handles this via ref counting)
      }),
    );
  }

  complete(key: string): void {
    const subject = this.subjects.get(key);
    if (subject) {
      subject.complete();
      this.subjects.delete(key);
    }
  }
}
