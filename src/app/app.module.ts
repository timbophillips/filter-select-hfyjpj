import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { FilterSelectBoxComponent } from './filter-select/filter-select.component';

@NgModule({
  imports:      [ BrowserModule, FormsModule ],
  declarations: [ AppComponent, FilterSelectBoxComponent ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
