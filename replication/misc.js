// returns millis
function time(f) {
    var start = new Date();
    f();
    return (new Date()) - start;
}

function ptime(f) {
    print("" + time(f) + "ms");
}

print();
print("run:");
print("  ptime(some_function)");
print();
