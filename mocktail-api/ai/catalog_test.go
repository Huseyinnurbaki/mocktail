package ai

import (
	"strings"
	"testing"

	"mocktail-api/core"
	"mocktail-api/database"

	"github.com/ncruces/go-sqlite3/gormlite"
	"gorm.io/gorm"
)

func TestCatalogContext(t *testing.T) {
	t.Run("empty when no DB", func(t *testing.T) {
		database.DBConn = nil
		if got := catalogContext(); got != "" {
			t.Fatalf("catalogContext() = %q, want empty when DB is nil", got)
		}
	})

	t.Run("lists endpoints with response bodies", func(t *testing.T) {
		db, err := gorm.Open(gormlite.Open(":memory:"), &gorm.Config{})
		if err != nil {
			t.Fatalf("open db: %v", err)
		}
		if err := db.AutoMigrate(&core.Api{}); err != nil {
			t.Fatalf("migrate: %v", err)
		}
		database.DBConn = db
		t.Cleanup(func() { database.DBConn = nil })

		db.Create(&core.Api{
			Endpoint:   "api/v1/auth/logout",
			Method:     "POST",
			Key:        "POSTapi/v1/auth/logout",
			StatusCode: 200,
			Response:   []byte(`{"message":"logged out"}`),
		})

		ctx := catalogContext()
		if !strings.Contains(ctx, "POST /api/v1/auth/logout -> 200") {
			t.Fatalf("catalog missing endpoint line: %q", ctx)
		}
		if !strings.Contains(ctx, `{"message":"logged out"}`) {
			t.Fatalf("catalog missing response body: %q", ctx)
		}
	})
}
