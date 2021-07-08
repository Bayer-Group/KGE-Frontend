import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: "highlight" })
export class HighlightPipe implements PipeTransform {
  transform(text: string, search, db?) {
    const pattern = search
      .replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
      // .split(" ")
      // .filter(t => t.length > 0)
      // .join("|");
    const regex = new RegExp(pattern, "gi");
    // when using the bold tag, the dom now longer displays the space so we have to use &nbsp as a replacement for a whitespace
    const value = search ? text.replace(regex, match => {
      const split = text.split(match);
      const whitespaceRight = split[1].charAt(0) === " ";
      const whitespaceLeft = split[0].charAt(split[0].length - 1) === " ";
      const lastCharIsWhitespace = search.charAt(search.length - 1) === " ";
      return `<b>${whitespaceLeft ? "&nbsp" : ""}
        ${match}${whitespaceRight || lastCharIsWhitespace ? "&nbsp" : ""}</b>`;
    }) : text;
    const fromDB = db ? `&nbsp<span class="fromDB">from ${db}</span>` : "";
    return `${value}${fromDB}`;
  }
}
