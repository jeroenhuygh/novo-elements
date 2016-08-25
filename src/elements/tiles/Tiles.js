// NG2
import { Component, Input, Output, EventEmitter, forwardRef, Provider, ElementRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { isBlank } from '@angular/core/src/facade/lang';

// Value accessor for the component (supports ngModel)
const TILES_VALUE_ACCESSOR = new Provider(NG_VALUE_ACCESSOR, {
    useExisting: forwardRef(() => NovoTilesElement),
    multi: true
});

@Component({
    selector: 'novo-tiles',
    providers: [TILES_VALUE_ACCESSOR],
    template: `
        <div class="tile-container">
            <div class="tile" *ngFor="let option of _options; let i = index" [ngClass]="{active: option.checked}" (click)="select($event, option, i)">
                <label [attr.for]="name + i">
                    {{ option.label || option}}
                </label>
                <input [hidden]="true" [name]="name" type="radio" [value]="option.checked || option" [attr.id]="name + i">
            </div>
            <span class="active-indicator" [hidden]="(activeTile === undefined || activeTile === null)"></span>
        </div>
    `
})
export class NovoTilesElement implements ControlValueAccessor {
    @Input() name:String;
    @Input() options:any;
    @Input() required:boolean;
    @Output() onChange:EventEmitter<any> = new EventEmitter();

    _options:Array = [];
    activeTile:any = null;

    model:any;
    onModelChange:Function = () => {
    };
    onModelTouched:Function = () => {
    };

    constructor(element:ElementRef) {
        this.element = element;
    }

    ngOnInit() {
        this.name = this.name || '';
        this.setupOptions();
    }

    setupOptions() {
        if (this.options && this.options.length && (this.options[0].value === undefined || this.options[0].value === null)) {
            this._options = this.options.map((x) => {
                let item = { value: x, label: x, checked: this.model === x };
                return item;
            });
        } else {
            this._options = this.options.map((x) => {
                x.checked = this.model === x.value;
                if (x.checked) {
                    this.setTile(x);
                }
                return x;
            });
        }
    }

    select(event, item) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        for (let option of this._options) {
            option.checked = false;
        }

        item.checked = !item.checked;
        this.onChange.emit(item.value);
        this.onModelChange(item.value);
        this.setTile(item);
    }

    setTile(item) {
        if (item) {
            this.activeTile = item.value;
            this.moveTile();
        }
    }

    moveTile() {
        setTimeout(() => {
            let ind = this.element.nativeElement.querySelector('.active-indicator');
            let el = this.element.nativeElement.querySelector('.tile.active');
            let w = el.clientWidth;
            let left = el.offsetLeft;

            // These style adjustments need to occur in this order.
            // TODO: Remove this and use ngAnimate2 - @asibilia
            setTimeout(() => {
                ind.style.width = `${w + 4}px`;
                setTimeout(() => {
                    ind.style.transform = `translateX(${left}px)`;
                    setTimeout(() => {
                        ind.style.opacity = '1';
                    });
                });
            });
        });
    }

    writeValue(model:any):void {
        this.model = model;
        if (!isBlank(model)) {
            this.setupOptions();
        }
    }

    registerOnChange(fn:Function):void {
        this.onModelChange = fn;
    }

    registerOnTouched(fn:Function):void {
        this.onModelTouched = fn;
    }
}
