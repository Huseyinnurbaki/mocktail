package randomize

import (
	"encoding/json"
	"testing"
)

func TestFixedAndUnknown(t *testing.T) {
	data := map[string]interface{}{"a": "keep", "b": "change"}
	Apply(data, Config{
		"b": {Type: "fixed", Value: "fixed-val"},
		"a": {Type: "nonsense"}, // unknown → must be left untouched
	})
	if data["a"] != "keep" {
		t.Errorf("unknown type should leave value, got %v", data["a"])
	}
	if data["b"] != "fixed-val" {
		t.Errorf("fixed not applied, got %v", data["b"])
	}
}

func TestUUIDIsFreshEachApply(t *testing.T) {
	d1 := map[string]interface{}{"id": ""}
	d2 := map[string]interface{}{"id": ""}
	Apply(d1, Config{"id": {Type: "uuid"}})
	Apply(d2, Config{"id": {Type: "uuid"}})
	if d1["id"] == "" || d1["id"] == d2["id"] {
		t.Errorf("uuid should be non-empty and differ per request: %v vs %v", d1["id"], d2["id"])
	}
}

func TestArrayTraversal(t *testing.T) {
	var data interface{}
	json.Unmarshal([]byte(`{"users":[{"email":"a"},{"email":"b"}]}`), &data)
	Apply(data, Config{"users.email": {Type: "email"}})
	users := data.(map[string]interface{})["users"].([]interface{})
	for i, u := range users {
		e := u.(map[string]interface{})["email"].(string)
		if e == "a" || e == "b" || e == "" {
			t.Errorf("array element %d email not randomized: %q", i, e)
		}
	}
}

func TestNumberRange(t *testing.T) {
	five := 5.0
	v, ok := Generate(FieldSpec{Type: "number", Min: &five, Max: &five})
	if !ok || v.(int) != 5 {
		t.Errorf("number range [5,5] should yield 5, got %v (ok=%v)", v, ok)
	}
}
