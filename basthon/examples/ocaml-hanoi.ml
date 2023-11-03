let mouvement orig dest =
    print_endline ("Déplacer le sommet de la tige "
                   ^ orig ^ " sur la tige " ^ dest);;

let rec hanoi depart aux arrivee n =
    if n > 0 then
    begin
        hanoi depart arrivee aux (n - 1);
        mouvement depart arrivee;
        hanoi aux depart arrivee (n - 1);
    end;;

hanoi "A" "B" "C" 3
