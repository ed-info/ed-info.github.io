let fold_iter f init a b =
  let rec aux acc i =
    if i > b
    then (acc)
    else aux (f acc i) (succ i)
  in
  aux init a
 
let fold_step f init a b step =
  let rec aux acc i =
    if i > b
    then (acc)
    else aux (f acc i) (i + step)
  in
  aux init a
 
let remove li v =
  let rec aux acc = function
    | hd::tl when hd = v -> (List.rev_append acc tl)
    | hd::tl -> aux (hd::acc) tl
    | [] -> li
  in
  aux [] li
 
let primes n =
  let li =
    List.rev(fold_iter (fun acc i -> (i::acc)) [] 2 n)
  in
  let limit = truncate(sqrt(float n)) in
  fold_iter (fun li i ->
      if List.mem i li  (* test if (i) is prime *)
      then (fold_step remove li (i*i) n i)
      else li)
    li 2 (pred limit)
