import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  AfterViewInit,
  ChangeDetectorRef
} from "@angular/core";
import {
  Observable,
  of,
  fromEvent,
  merge,
  BehaviorSubject,
  combineLatest
} from "rxjs";
import {
  filter,
  first,
  map,
  tap,
  distinctUntilChanged,
  debounceTime,
  delay,
  switchMap,
  concatMap,
  withLatestFrom,
  startWith,
  mapTo,
  debounce
} from "rxjs/operators";

export type option = { text: string; id: string; selected?: boolean };

type highlightedHTML = {
  preHighlight: string;
  highlightString: string;
  postHighlight: string;
};

@Component({
  selector: "filter-select",
  templateUrl: "./filter-select.component.html",
  styleUrls: ["./filter-select.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterSelectBoxComponent implements OnInit, AfterViewInit {
  @ViewChild("filterInput") filterInputElementRef: ElementRef;
  @ViewChild("selectBox") selectBoxElementRef: ElementRef;
  @ViewChild("dropdown") dropDownDivElementRef: ElementRef;
  @ViewChild("fakeInput") fakeInputElementRef: ElementRef;

  @Input() options: option[];
  @Output() result = new EventEmitter<option>();

  filteredOptions: Observable<option[]>;
  filteredOptionsHighlighted: Observable<highlightedHTML[]>;

  selectBox: HTMLSelectElement;
  filterInput: HTMLInputElement;
  fakeInput: HTMLInputElement;
  dropDownDiv: HTMLDivElement;

  filterInputKeyUp: Observable<string>;
  filterInputFocus: Observable<boolean>;
  filterInputBlurButNotSelect: Observable<boolean>;
  filterInputEnterKey: Observable<boolean>;

  selectBlur: Observable<boolean>;
  selectFocus: Observable<boolean>;
  selectFocusOrBlur: Observable<boolean>;
  selectClickorEnter: Observable<boolean>;

  weAreLive: Observable<boolean>;
  changeSelect: Observable<Event>;

  filterTextHTML: Observable<string>;
  filterTextSplit: Observable<highlightedHTML>;
  preHighlightHTML: Observable<string>;
  highlightHTML: Observable<string>;
  posHighlightHTML: Observable<string>;

  fakeInputFocus: Observable<boolean>;
  fakeInputDisable: Observable<boolean>;
  // fakeInputMouseDown: Observable<Event>;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.selectBox = this.selectBoxElementRef.nativeElement;
    this.filterInput = this.filterInputElementRef.nativeElement;
    this.fakeInput = this.fakeInputElementRef.nativeElement;
    this.dropDownDiv = this.dropDownDivElementRef.nativeElement;

    this.filterInputKeyUp = fromEvent(this.filterInput, "keyup").pipe(
      tap(e =>
        (e as KeyboardEvent).keyCode == 40 ? this.selectBox.focus() : null
      ),
      filter(
        e =>
          (e as KeyboardEvent).keyCode !== 13 &&
          (e as KeyboardEvent).keyCode !== 40
      ),
      debounceTime(100),
      distinctUntilChanged(),
      map(x => (x.target as HTMLInputElement).value),
      startWith("")
    );

    this.filterInputFocus = fromEvent(this.filterInput, "focus").pipe(
      mapTo(true)
    );

    this.fakeInputFocus = merge(
      fromEvent(this.fakeInput, "focus"),
      fromEvent(this.fakeInput, "keyup"),
      fromEvent(this.fakeInput, "click")
    ).pipe(
      mapTo(true),
      tap(b => setTimeout(() => this.filterInput.focus(), 20))
    );

    this.selectFocus = fromEvent(this.selectBox, "focus").pipe(mapTo(true));
    this.selectBlur = fromEvent(this.selectBox, "blur").pipe(mapTo(true));

    this.selectFocusOrBlur = merge(
      this.selectBlur.pipe(map(x => !x)),
      this.selectFocus
    ).pipe(startWith(false));

    this.filterInputBlurButNotSelect = fromEvent(this.filterInput, "blur").pipe(
      mapTo(true),
      delay(10),
      withLatestFrom(this.selectFocusOrBlur),
      map(([x, y]) => y)
    );

    this.filteredOptions = merge(this.filterInputKeyUp, of("")).pipe(
      map(filterString =>
        this.options
          .filter(
            x => x.text.toLowerCase().indexOf(filterString.toLowerCase()) > -1
          )
          .map(y => {
            y.selected = false;
            return y;
          })
      ),
      map(x => {
        if (x[0]) {
          x[0].selected = true;
        }
        return x;
      })
    );

    this.selectClickorEnter = merge(
      fromEvent(this.selectBox, "keyup").pipe(
        filter(e => (e as KeyboardEvent).keyCode == 13)
      ),
      fromEvent(this.selectBox, "click")
    ).pipe(mapTo(true));

    this.filterInputEnterKey = fromEvent(this.filterInput, "keyup").pipe(
      filter(e => (e as KeyboardEvent).keyCode == 13),
      mapTo(true)
    );

    this.filterTextHTML = merge(
      this.selectClickorEnter,
      this.filterInputEnterKey
    ).pipe(
      tap(x => {
        this.result.emit({
          text: this.selectBox.options[this.selectBox.selectedIndex].text,
          id: this.selectBox.value
        });
      }),
      map(x => this.selectBox.options[this.selectBox.selectedIndex].text)
    );

    this.filterTextSplit = this.filterTextHTML.pipe(
      withLatestFrom(this.filterInputKeyUp),
      map(([x, y]) =>
        this.filterFormat({
          searchString: x,
          resultString: this.selectBox.options[this.selectBox.selectedIndex]
            .text
        })
      )
    );

    this.preHighlightHTML = this.filterTextSplit.pipe(map(x => x.preHighlight));
    this.highlightHTML = this.filterTextSplit.pipe(map(x => x.highlightString));
    this.posHighlightHTML = this.filterTextSplit.pipe(
      map(x => x.postHighlight)
    );

    this.filteredOptionsHighlighted = this.filteredOptions.pipe(
      withLatestFrom(this.filterInputKeyUp),
      map(([x, y]) =>
        x.map(z =>
          this.filterFormat({
            searchString: y,
            resultString: z.text
          })
        )
      )
    );

    this.weAreLive = merge(
      this.filterInputBlurButNotSelect,
      this.fakeInputFocus,
      merge(fromEvent(this.selectBox, "blur")).pipe(map(x => false)),
      this.selectClickorEnter.pipe(map(x => !x)),
      this.filterTextHTML.pipe(map(x => false))
    );

    this.cdr.detectChanges();
  }

  filterFormat = (arg: {
    searchString: string;
    resultString: string;
  }): highlightedHTML => {
    if (!arg.searchString) {
      return {
        preHighlight: arg.resultString,
        highlightString: "",
        postHighlight: ""
      };
    } else {
      let b4String = arg.resultString.substr(
        0,
        arg.resultString.toLowerCase().indexOf(arg.searchString.toLowerCase())
      );
      let highlightString = arg.resultString.substr(
        arg.resultString.toLowerCase().indexOf(arg.searchString.toLowerCase()),
        arg.searchString.length
      );
      let afterString = arg.resultString.substr(
        arg.resultString.toLowerCase().indexOf(arg.searchString.toLowerCase()) +
          arg.searchString.length,
        arg.resultString.length
      );
      return {
        preHighlight: b4String,
        highlightString: highlightString,
        postHighlight: afterString
      };
    }
  };
}
