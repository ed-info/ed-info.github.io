(*
Example from
https://ocsigen.org/js_of_ocaml/latest/manual/files/toplevel/index.html
*)

open Js_of_ocaml_lwt
open Graphics_js

let canvas = Basthon.create_canvas ()

let () =
  open_canvas canvas;
  resize_window 300 300
  
let c = 5

let x0 = 0 and x1 = size_x () and y0 = 0 and y1 = size_y ()

let draw_ball x y =
  set_color red;
  fill_circle x y c

let state = ref (Lwt.task ())

let wait () = fst !state

let rec pong_aux x y dx dy =
  draw_ball x y;
  let new_x = x + dx and new_y = y + dy in
  let new_dx = if new_x - c <= x0 || new_x + c >= x1 then -dx else dx
  and new_dy = if new_y - c <= y0 || new_y + c >= y1 then -dy else dy in
  Lwt.bind (wait ()) (fun () -> pong_aux new_x new_y new_dx new_dy)

let rec start () =
  let t = Lwt.task () in
  let _, w = !state in
  state := t;
  clear_graph ();
  Lwt.wakeup w ();
  Lwt.bind (Lwt_js.sleep (1. /. 60.)) start

let pong x y dx dy = pong_aux x y dx dy

let () =
  ignore (pong 111 87 2 3);
  ignore (pong 28 57 5 3);
  ignore (start ());
  Basthon.display_canvas canvas
