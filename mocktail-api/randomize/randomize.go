// Package randomize applies per-field fake-data generation to a mock response.
//
// A Config maps a dot-separated JSON path to a field spec, e.g.
//
//	{ "email": {"type":"email"}, "users.id": {"type":"uuid"} }
//
// Paths that traverse an array apply to every element (so "users.email"
// randomizes email on each item). Unknown types are left untouched.
package randomize

import (
	"strings"

	"github.com/brianvoe/gofakeit/v7"
)

// FieldSpec describes how a single field is generated.
type FieldSpec struct {
	Type  string      `json:"type"`
	Min   *float64    `json:"min,omitempty"`
	Max   *float64    `json:"max,omitempty"`
	Value interface{} `json:"value,omitempty"` // used when Type == "fixed"
}

// Config maps a dot-path to its generator spec.
type Config map[string]FieldSpec

// Generate produces a value for the spec. The bool is false for unknown types,
// signalling the caller to leave the original value in place.
func Generate(spec FieldSpec) (interface{}, bool) {
	switch spec.Type {
	case "uuid":
		return gofakeit.UUID(), true
	case "firstName":
		return gofakeit.FirstName(), true
	case "lastName":
		return gofakeit.LastName(), true
	case "fullName", "name":
		return gofakeit.Name(), true
	case "email":
		return gofakeit.Email(), true
	case "phone":
		return gofakeit.Phone(), true
	case "username":
		return gofakeit.Username(), true
	case "url":
		return gofakeit.URL(), true
	case "domain":
		return gofakeit.DomainName(), true
	case "ipv4":
		return gofakeit.IPv4Address(), true
	case "number":
		min, max := 0, 1000
		if spec.Min != nil {
			min = int(*spec.Min)
		}
		if spec.Max != nil {
			max = int(*spec.Max)
		}
		if min > max {
			min, max = max, min
		}
		return gofakeit.Number(min, max), true
	case "float":
		min, max := 0.0, 1000.0
		if spec.Min != nil {
			min = *spec.Min
		}
		if spec.Max != nil {
			max = *spec.Max
		}
		return gofakeit.Float64Range(min, max), true
	case "price":
		min, max := 1.0, 1000.0
		if spec.Min != nil {
			min = *spec.Min
		}
		if spec.Max != nil {
			max = *spec.Max
		}
		return gofakeit.Price(min, max), true
	case "bool":
		return gofakeit.Bool(), true
	case "word":
		return gofakeit.Word(), true
	case "sentence":
		return gofakeit.Sentence(8), true
	case "paragraph":
		return gofakeit.Paragraph(1, 3, 8, " "), true
	case "pastDate":
		return gofakeit.PastDate(), true
	case "futureDate":
		return gofakeit.FutureDate(), true
	case "city":
		return gofakeit.City(), true
	case "country":
		return gofakeit.Country(), true
	case "countryCode":
		return gofakeit.CountryAbr(), true
	case "hexColor":
		return gofakeit.HexColor(), true
	case "fixed":
		return spec.Value, true
	default:
		return nil, false
	}
}

// Apply mutates data in place, replacing every configured path with a freshly
// generated value, and returns it for convenience.
func Apply(data interface{}, cfg Config) interface{} {
	for path, spec := range cfg {
		set(data, strings.Split(path, "."), spec)
	}
	return data
}

func set(node interface{}, segs []string, spec FieldSpec) {
	if len(segs) == 0 {
		return
	}
	switch n := node.(type) {
	case map[string]interface{}:
		if len(segs) == 1 {
			if v, ok := Generate(spec); ok {
				n[segs[0]] = v
			}
		} else {
			set(n[segs[0]], segs[1:], spec)
		}
	case []interface{}:
		for _, item := range n {
			set(item, segs, spec)
		}
	}
}
