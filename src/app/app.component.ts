import { Component } from "@angular/core";
import { option } from "./filter-select/filter-select.component";

const options: option[] = [
  {
    text:
      "Tim is the greatest coder in the history of codingTim is the greatest coder in the history of codingTim is the greatest coder in the history of codingTim is the greatest coder in the history of coding",
    id: "TP"
  },
  { text: "Ben", id: "BP" },
  { text: "Katie", id: "KP" },
  { text: "John", id: "JP" },
  { text: "Sue", id: "SP" },
  { text: "Sarah", id: "SR" },
  { text: "Claire", id: "CB" },
  { text: "Drew", id: "AM" },
  { text: "Molly", id: "MP" },
  { text: "Lucy", id: "LP" },
  { text: "Jess", id: "JP2" },
  { text: "George", id: "GP" },
  { text: "Daisy", id: "DM" },
  { text: "Benny", id: "BP2" }
];

@Component({
  selector: "my-app",
  templateUrl: 'app.component.html' ,
  styleUrls: ['app.component.css']
})
export class AppComponent {
  options = options;
  selectedOption: option;
  onResult(id: option) {
    this.selectedOption = id;
  }
}
