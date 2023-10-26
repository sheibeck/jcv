import type { Version } from "./Version";

// Compares two strings
function check(a: string, b: string)
{
    let al = a.length;
    let bl = b.length;
 
    let i = 0, j = 0;
    while (i < al && j < bl) {
        if (a[i] == b[j]) {
            ++i;
            ++j;
        }
        else if (a[i] > b[j]) {
            return 1;
        }
        else
            return -1;
    }
 
    if (i == al && j == bl)
        return 0;
    if (i == al)
        return -1;
    return 1;
}
 
// Function to split strings based on dots
function getTokens(a: string)
{
    let v = []
 
    // Stringstream is used here for
    // tokenising the string based
    // on "." delimiter which might
    // contain unequal number of "."[dots]
    let ss = a.split('.');
    for (let s of ss)
        v.push(s);
     
    return v;
}
 
// Comparator to sort the array of strings
export function VersionCompare(a: Version, b: Version)
{
    // Stores the numerical substrings
    let va = [], vb = [];
    va = getTokens(a.Number);
    vb = getTokens(b.Number);
 
    // Iterate up to length of minimum
    // of the two strings
    for (var i = 0; i < Math.min(va.length, vb.length);
        i++) {
 
        // Compare each numerical substring
        // of the two strings
        let countCheck = check(va[i], vb[i]);
 
        if (countCheck == -1)
            return false;
 
        else if (countCheck == 1)
            return true;
    }
 
    if (va.length < vb.length)
        return false;
 
    return true;
}
 